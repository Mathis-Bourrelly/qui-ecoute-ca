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
          break;
        }

        case 'participant:joined': {
          const { name, lobbyCode } = payload || {};
          const s = ensureLobby(lobbyCode);
          if (!s) break;
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
          s.votes = s.votes || {};
          s.votes[trackIndex] = s.votes[trackIndex] || [];
          if (!s.votes[trackIndex].some(v => v.voterName === vote.voterName)) s.votes[trackIndex].push(vote);
          s.game.votes = s.votes;
          broadcast({ type: 'vote:new', payload: { lobbyCode, trackIndex, vote } }, ws);
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
