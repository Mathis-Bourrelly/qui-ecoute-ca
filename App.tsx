
import React, { useState, useEffect, useRef } from 'react';
import { Submission, GameState, UserRole, Vote } from './types';
import { extractVideoId, extractTimecode, shuffleArray, generateLobbyCode, createWebSocketClient, WSMessage } from './utils';

// Importation des composants modulaires
import LandingView from './view/LandingView';
import AdminLobby from './component/AdminLobby';
import AdminGameView from './view/AdminGameView';
import PlayerSubmissionForm from './component/PlayerSubmissionForm';
import PlayerVotingView from './view/PlayerVotingView';
import FinishedView from './view/FinishedView';
import ErrorModal from './component/ErrorModal';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('none');
  const [playerName, setPlayerName] = useState<string>(localStorage.getItem('qui_ecoute_ca_name') || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('qui_ecoute_ca_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [game, setGame] = useState<GameState>(() => {
    const saved = localStorage.getItem('qui_ecoute_ca_game');
    return saved ? JSON.parse(saved) : {
      status: 'setup',
      currentTrackIndex: 0,
      shuffledPlaylist: [],
      lobbyCode: '',
      participants: [],
      votes: {},
      roundTimer: 30,
    };
  });

  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null);
  const gameRef = useRef<GameState>(game);

  useEffect(() => { gameRef.current = game; }, [game]);

  useEffect(() => {
    // init WS client to receive game updates from presenter
    wsClientRef.current = createWebSocketClient({
      onMessage: (msg: WSMessage) => {
        try {
          console.log('WS in client <-', msg, 'localLobby', gameRef.current?.lobbyCode);
          if (!msg || !msg.type) return;

          if (msg.type === 'game:update' && msg.payload) {
            setGame(msg.payload as GameState);
            return;
          }

          if (msg.type === 'participant:joined' && msg.payload) {
            const { name, lobbyCode } = msg.payload as { name: string; lobbyCode?: string };
            setGame(prev => {
              const currentLobby = (prev.lobbyCode || '').toString().trim().toUpperCase();
              if (!currentLobby || (lobbyCode || '').toString().trim().toUpperCase() !== currentLobby) return prev;
              const participants = Array.from(new Set([...(prev.participants || []), name]));
              return { ...prev, participants };
            });
            return;
          }

          if (msg.type === 'submission:new' && msg.payload) {
            // payload may be { lobbyCode, submission }
            const p = msg.payload as any;
            const sub = p.submission || p;
            const lobby = (p.lobbyCode || '').toString().trim().toUpperCase();
            const currentLobby = (gameRef.current?.lobbyCode || '').toString().trim().toUpperCase();
            if (lobby && lobby !== currentLobby) return;
            setSubmissions(prev => {
              if (prev.some(s => s.id === sub.id)) {
                console.log('submission already present, skipping', sub.id);
                return prev;
              }
              console.log('adding submission from WS', sub.id, sub.senderName);
              return [...prev, sub];
            });

            // ensure participant list contains the sender
            setGame(prev => ({ ...prev, participants: Array.from(new Set([...(prev.participants || []), sub.senderName])) }));

            return;
          }

          if (msg.type === 'submission:bulk' && msg.payload) {
            const { lobbyCode, submissions: subs } = msg.payload as { lobbyCode: string; submissions: Submission[] };
            const currentLobby = (game.lobbyCode || '').toString().trim().toUpperCase();
            if (!lobbyCode || lobbyCode.toString().trim().toUpperCase() !== currentLobby) return;
            setSubmissions(subs || []);
            return;
          }

          if (msg.type === 'vote:new' && msg.payload) {
            const p = msg.payload as any;
            const { lobbyCode, trackIndex, vote } = p;
            const currentLobby = (game.lobbyCode || '').toString().trim().toUpperCase();
            if (lobbyCode && lobbyCode.toString().trim().toUpperCase() !== currentLobby) return;
            setGame(prev => {
              const existing = prev.votes[trackIndex] || [];
              if (existing.some(v => v.voterName === vote.voterName)) return prev;
              return { ...prev, votes: { ...prev.votes, [trackIndex]: [...existing, vote] } };
            });
            return;
          }

          if (msg.type === 'votes:bulk' && msg.payload) {
            const { lobbyCode, votes } = msg.payload as { lobbyCode: string; votes: Record<number, Vote[]> };
            const currentLobby = (game.lobbyCode || '').toString().trim().toUpperCase();
            if (!lobbyCode || lobbyCode.toString().trim().toUpperCase() !== currentLobby) return;
            setGame(prev => ({ ...prev, votes: votes || {} }));
            return;
          }

          if (msg.type === 'game:start' && msg.payload) {
            setGame(msg.payload as GameState);
            return;
          }

          if (msg.type === 'track:next' && msg.payload) {
            const { newIndex } = msg.payload as { newIndex: number };
            setGame(prev => ({ ...prev, currentTrackIndex: newIndex }));
            return;
          }
        } catch (e) {
          console.warn('Failed to apply WS message', e);
        }
      }
    });

    return () => wsClientRef.current?.close();
  }, []);

  useEffect(() => {
    localStorage.setItem('qui_ecoute_ca_data', JSON.stringify(submissions));
    localStorage.setItem('qui_ecoute_ca_game', JSON.stringify(game));
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qui_ecoute_ca_data') setSubmissions(JSON.parse(e.newValue || '[]'));
      if (e.key === 'qui_ecoute_ca_game') setGame(JSON.parse(e.newValue || '{}'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [submissions, game]);

  // Synchronisation avec le code de l'URL si présent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setGame(prev => ({ ...prev, lobbyCode: codeParam.toUpperCase() }));
    }
  }, []);

  const handleCreateGame = () => {
    const newCode = generateLobbyCode();
    const newGame: GameState = { 
      status: 'setup', 
      lobbyCode: newCode, 
      currentTrackIndex: 0, 
      shuffledPlaylist: [], 
      participants: [], 
      votes: {},
      roundTimer: 30
    };

    setGame(newGame);

    // broadcast to other connected clients so they pick up the lobbyCode
    try {
      wsClientRef.current?.send({ type: 'game:update', payload: newGame });
    } catch (e) {
      console.warn('WS broadcast failed', e);
    }
    setSubmissions([]);
    setRole('admin');
  };

  const setRoundTimer = (seconds: number) => {
    setGame(prev => ({ ...prev, roundTimer: seconds }));
  };

  const handleJoinGame = (code: string, name: string) => {
    const normalized = (code || '').trim().toUpperCase();
    const lobby = (game.lobbyCode || '').toString().trim().toUpperCase();

    if (!lobby) {
      console.warn('attempt to join but no lobbyCode present in game state', { code: normalized, game });
      return setErrorMessage("Aucun plateau actif (réessayez depuis l'écran du présentateur)");
    }

    if (normalized === lobby) {
      if (!name) return setErrorMessage("Choisis un nom de scène !");
      setRole('player');
      setPlayerName(name);
      localStorage.setItem('qui_ecoute_ca_name', name);
      
      if (!game.participants.includes(name)) {
        setGame(prev => ({ ...prev, participants: [...prev.participants, name] }));
        // notify other clients (host) that a participant joined
        try {
          wsClientRef.current?.send({ type: 'participant:joined', payload: { name, lobbyCode: normalized } });
        } catch (e) {
          console.warn('failed to send participant:joined', e);
        }
      }
    } else {
      console.warn('invalid lobby code entered', { entered: normalized, expected: lobby });
      setErrorMessage("Code de plateau invalide !");
    }
  };

  const addSubmission = async (url: string, manualTime: number) => {
    const videoId = extractVideoId(url);
    if (!videoId) return setErrorMessage("L'URL YouTube est invalide !");
    
    setIsLoadingTitle(true);
    let videoTitle = "Musique Mystère";
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      videoTitle = data.title || "Musique Mystère";
    } catch (e) {
      console.error("Erreur lors de la récupération du titre", e);
    } finally {
      setIsLoadingTitle(false);
    }
    
    const urlTime = extractTimecode(url);
    const finalStartTime = manualTime > 0 ? manualTime : urlTime;
    
    const newSub: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      senderName: playerName,
      youtubeUrl: url,
      videoId,
      videoTitle,
      startTime: finalStartTime,
      timestamp: Date.now()
    };
    setSubmissions(prev => [...prev, newSub]);

    // broadcast submission so host / other clients see it
    try {
      const payload = { lobbyCode: game.lobbyCode, submission: newSub };
      console.log('WS out -> submission:new', payload);
      wsClientRef.current?.send({ type: 'submission:new', payload });
    } catch (e) {
      console.warn('failed to broadcast submission', e);
    }
  };

  const startGame = () => {
    if (submissions.length < 1) return;
    const allSenders = Array.from(new Set(submissions.map(s => s.senderName)));
    const newGame: GameState = {
      ...game,
      status: 'playing',
      currentTrackIndex: 0,
      participants: Array.from(new Set([...(game.participants || []), ...allSenders])),
      shuffledPlaylist: shuffleArray(submissions),
      votes: {},
    };
    setGame(newGame);

    try {
      wsClientRef.current?.send({ type: 'game:start', payload: newGame });
    } catch (e) {
      console.warn('failed to broadcast game:start', e);
    }
  };

  const handleVote = (guessedName: string) => {
    const currentVotes = game.votes[game.currentTrackIndex] || [];
    if (currentVotes.some(v => v.voterName === playerName)) return;

    const newVote: Vote = { voterName: playerName, guessedName };
    setGame(prev => ({
      ...prev,
      votes: {
        ...prev.votes,
        [prev.currentTrackIndex]: [...(prev.votes[prev.currentTrackIndex] || []), newVote]
      }
    }));

    // broadcast vote so host can aggregate in real time
    try {
      wsClientRef.current?.send({ type: 'vote:new', payload: { lobbyCode: game.lobbyCode, trackIndex: game.currentTrackIndex, vote: newVote } });
    } catch (e) {
      console.warn('failed to broadcast vote', e);
    }
  };

  const nextTrack = () => {
    if (game.currentTrackIndex < game.shuffledPlaylist.length - 1) {
      const newIndex = game.currentTrackIndex + 1;
      setGame(prev => ({ ...prev, currentTrackIndex: newIndex }));
      try {
        wsClientRef.current?.send({ type: 'track:next', payload: { lobbyCode: game.lobbyCode, newIndex } });
      } catch (e) {
        console.warn('failed to broadcast track:next', e);
      }
    } else {
      const newGame = { ...game, status: 'finished' };
      setGame(newGame);
      try {
        wsClientRef.current?.send({ type: 'game:update', payload: newGame });
      } catch (e) {
        console.warn('failed to broadcast game finished', e);
      }
    }
  };

  const resetGame = () => {
    window.location.reload();
  };

  if (errorMessage) return <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />;
  if (role === 'none') return <LandingView onCreate={handleCreateGame} onJoin={handleJoinGame} />;
  
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#1e1b4b] text-white flex flex-col font-bold overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto px-3 md:px-4 flex-1 flex flex-col">
        <header className="flex justify-between items-center my-4 md:my-6 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 md:p-5 rounded-2xl md:rounded-b-[2.5rem] shadow-2xl border-b-4 md:border-b-8 border-orange-700">
          <div className="flex flex-col">
            <h1 className="text-sm md:text-lg font-black text-indigo-950 uppercase italic tracking-tighter leading-none">QUI ÉCOUTE ÇA ?</h1>
              <div className="mt-1 bg-indigo-900 px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-2">
              <span className="text-[7px] md:text-[9px] text-yellow-400 font-black uppercase">PLATEAU</span>
              <span className="text-sm md:text-xl font-black text-white tracking-widest leading-none">#{game.lobbyCode || '----'}</span>
            </div>
          </div>
          <button onClick={resetGame} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase italic border-b-2 md:border-b-4 border-red-800 active:translate-y-1 active:border-b-0 transition-all">QUITTER</button>
        </header>

        <main className="flex-1 pb-8">
          {role === 'admin' ? (
            game.status === 'setup' ? (
              <AdminLobby submissions={submissions} game={game} onStart={startGame} setTimer={setRoundTimer} />
            ) : game.status === 'playing' ? (
              <AdminGameView game={game} onNext={nextTrack} />
            ) : (
              <FinishedView onRestart={resetGame} />
            )
          ) : (
            game.status === 'setup' ? (
              <PlayerSubmissionForm 
                playerName={playerName} 
                onSubmit={addSubmission} 
                submissionCount={submissions.filter(s => s.senderName === playerName).length} 
                isProcessing={isLoadingTitle} 
              />
            ) : game.status === 'playing' ? (
              <PlayerVotingView game={game} playerName={playerName} onVote={handleVote} />
            ) : (
              <FinishedView onRestart={resetGame} />
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
