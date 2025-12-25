#!/usr/bin/env node
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT_WS || 3001;

const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`WebSocket server listening on ws://0.0.0.0:${PORT}`);

// Broadcast a message to all clients except optional sender
function broadcast(data, sender) {
  const raw = typeof data === 'string' ? data : JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(raw);
    }
  }
}

// In-memory authoritative state per lobby
const games = new Map();

function ensureLobby(lobbyCode) {
  const code = (lobbyCode || '').toString().trim().toUpperCase();
  if (!code) return null;
  if (!games.has(code)) {
    games.set(code, { game: { status: 'setup', currentTrackIndex: 0, shuffledPlaylist: [], lobbyCode: code, participants: [], votes: {}, roundTimer: 30 }, submissions: [], votes: {} });
  }
  return games.get(code);
}

wss.on('connection', (ws, req) => {
  const addr = req.socket.remoteAddress + ':' + req.socket.remotePort;
  console.log('client connected', addr);

  // Send existing state for all lobbies to the newly connected client
  for (const [code, state] of games.entries()) {
    try {
      ws.send(JSON.stringify({ type: 'game:update', payload: state.game }));
      if (state.submissions && state.submissions.length) {
        ws.send(JSON.stringify({ type: 'submission:bulk', payload: { lobbyCode: code, submissions: state.submissions } }));
      }
      if (state.votes && Object.keys(state.votes).length) {
        ws.send(JSON.stringify({ type: 'votes:bulk', payload: { lobbyCode: code, votes: state.votes } }));
      }
    } catch (e) {
      console.warn('failed to send initial state to client', e);
    }
  }

  ws.on('message', (message) => {
    let parsed = message;
    try {
      parsed = JSON.parse(message.toString());
    } catch (e) {
      // keep raw
    }
    // Expect messages with a `type` and `payload`.
    const type = parsed && parsed.type;
    const payload = parsed && parsed.payload;
    console.log('WS in <-', { from: addr, type, payload });
    if (!type) return;

    try {
      switch (type) {
        case 'game:update':
        case 'game:start': {
          const g = payload;
          const lobby = (g && g.lobbyCode || '').toString().trim().toUpperCase();
          if (!lobby) break;
          const s = ensureLobby(lobby);
          s.game = g;
          // keep existing submissions if present
          broadcast({ type: 'game:update', payload: g }, ws);

          // If the game finished, compute and broadcast scores for a results page
          try {
            if (g && g.status === 'finished') {
              // compute per-player stats:
              // - correctMade: number of correct guesses the player made (voter successes)
              // - correctReceived: number of times the player's own submissions were correctly identified
              // - submissions: number of tracks the player submitted
              const scores = {};
              const participants = Array.from(new Set([...(s.game.participants || []), ...(s.submissions || []).map(x => x.senderName)]));
              participants.forEach(p => { scores[p] = { correctMade: 0, correctReceived: 0, submissions: 0 }; });

              const playlist = (s.game.shuffledPlaylist && Array.isArray(s.game.shuffledPlaylist)) ? s.game.shuffledPlaylist : s.submissions || [];

              // Count submissions per player
              playlist.forEach(track => {
                const sender = track && track.senderName;
                if (sender) {
                  if (!scores[sender]) scores[sender] = { correctMade: 0, correctReceived: 0, submissions: 0 };
                  scores[sender].submissions = (scores[sender].submissions || 0) + 1;
                }
              });

              const votesMap = s.game.votes || {};
              for (const [idxStr, votes] of Object.entries(votesMap)) {
                const idx = Number(idxStr);
                const actual = (playlist[idx] && playlist[idx].senderName) ? playlist[idx].senderName : null;
                if (Array.isArray(votes)) {
                  for (const v of votes) {
                    const voter = v.voterName;
                    const guessed = v.guessedName;
                    if (voter && !scores[voter]) scores[voter] = { correctMade: 0, correctReceived: 0, submissions: 0 };
                    if (guessed && !scores[guessed]) scores[guessed] = { correctMade: 0, correctReceived: 0, submissions: 0 };

                    // If guess matches actual submitter, increment both voter success and actual's received count
                    if (actual && guessed === actual) {
                      if (voter) scores[voter].correctMade = (scores[voter].correctMade || 0) + 1;
                      scores[actual].correctReceived = (scores[actual].correctReceived || 0) + 1;
                    }
                  }
                }
              }

              // Send scores back to the sender (host/admin)
              try {
                const msgObj = { type: 'scores:update', payload: { lobbyCode: lobby, scores } };
                const msg = JSON.stringify(msgObj);
                if (ws && ws.readyState === ws.OPEN) {
                  ws.send(msg);
                }
                // Also broadcast to other clients to ensure UI gets the values (helps avoid client-specific routing issues)
                broadcast(msgObj, ws);
              } catch (e) {
                console.warn('failed to send/broadcast scores', e);
              }
            }
          } catch (e) {
            console.warn('failed to compute/broadcast scores', e);
          }
          break;
        }

        case 'participant:joined': {
          const { name, lobbyCode } = payload || {};
          const lobby = (lobbyCode || '').toString().trim().toUpperCase();
          // Do not create a new lobby when a participant attempts to join — require the lobby to exist.
          if (!games.has(lobby)) {
            try {
              ws.send(JSON.stringify({ type: 'error', payload: { message: 'Lobby introuvable', lobbyCode: lobby } }));
            } catch (e) {
              console.warn('failed to send lobby-not-found to client', e);
            }
            break;
          }
          const s = games.get(lobby);
          s.game.participants = Array.from(new Set([...(s.game.participants || []), name]));
          broadcast({ type: 'game:update', payload: s.game }, ws);
          break;
        }

        case 'submission:new': {
          // payload: { lobbyCode, submission }
          const { lobbyCode, submission } = payload || {};
          const s = ensureLobby(lobbyCode);
          if (!s) break;
          if (!s.submissions.some(x => x.id === submission.id)) s.submissions.push(submission);
          broadcast({ type: 'submission:new', payload: { lobbyCode: lobbyCode, submission } }, ws);
          break;
        }

        case 'submission:bulk': {
          const { lobbyCode, submissions } = payload || {};
          const s = ensureLobby(lobbyCode);
          if (!s) break;
          s.submissions = submissions || [];
          broadcast({ type: 'submission:bulk', payload: { lobbyCode: lobbyCode, submissions: s.submissions } }, ws);
          break;
        }

         case 'vote:new': {
            const { lobbyCode, trackIndex, vote } = payload || {};
            const s = ensureLobby(lobbyCode);
            if (!s) break;
            const idx = Number(trackIndex);
            
            if (!s.game.votes) s.game.votes = {};
            if (!s.game.votes[idx]) s.game.votes[idx] = [];

            const alreadyVoted = s.game.votes[idx].some(v => v.voterName === vote.voterName);
            
            if (!alreadyVoted) {
                s.game.votes[idx].push(vote);
                console.log(`Vote ajouté pour le lobby ${lobbyCode}, track ${idx}`);
            
                broadcast({ 
                type: 'vote:new', 
                payload: { lobbyCode, trackIndex: idx, vote } 
                }, ws);
            }
            break;
            }

        case 'track:next': {
          const { lobbyCode, newIndex } = payload || {};
          const s = ensureLobby(lobbyCode);
          if (!s) break;
          s.game.currentTrackIndex = newIndex;
          broadcast({ type: 'track:next', payload: { lobbyCode, newIndex } }, ws);
          break;
        }

        default: {
          // fallback: broadcast unknown message to others
          broadcast(parsed, ws);
          break;
        }
      }
    } catch (e) {
      console.warn('error handling message', e);
    }
  });

  ws.on('close', () => {
    console.log('client disconnected', addr);
  });

  ws.on('error', (err) => {
    console.warn('ws error', err.message || err);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => process.exit(0));
});
