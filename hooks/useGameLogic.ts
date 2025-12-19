import { useState, useEffect, useRef } from 'react';
import { Submission, GameState, UserRole, Vote } from '../types';
import { extractVideoId, extractTimecode, shuffleArray, generateLobbyCode, createWebSocketClient, WSMessage } from '../utils';

export const useGameLogic = () => {
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

  // WebSocket Logic
  useEffect(() => {
    wsClientRef.current = createWebSocketClient({
      onMessage: (msg: WSMessage) => {
        try {
          if (!msg || !msg.type) return;
          const currentLobby = (gameRef.current?.lobbyCode || '').toString().trim().toUpperCase();

          switch (msg.type) {
            case 'game:update':
            case 'game:start':
              setGame(msg.payload as GameState);
              break;
            case 'participant:joined':
              const { name, lobbyCode } = msg.payload as any;
              if (lobbyCode?.toUpperCase() !== currentLobby) return;
              setGame(prev => ({
                ...prev,
                participants: Array.from(new Set([...(prev.participants || []), name]))
              }));
              break;
            case 'submission:new':
              const { submission: sub, lobbyCode: subLobby } = msg.payload as any;
              if (subLobby?.toUpperCase() !== currentLobby) return;
              setSubmissions(prev => prev.some(s => s.id === sub.id) ? prev : [...prev, sub]);
              break;
            case 'vote:new':
              const { vote, trackIndex, lobbyCode: vLobby } = msg.payload as any;
              if (vLobby?.toUpperCase() !== currentLobby) return;
              setGame(prev => {
                const existing = prev.votes[trackIndex] || [];
                if (existing.some(v => v.voterName === vote.voterName)) return prev;
                return { ...prev, votes: { ...prev.votes, [trackIndex]: [...existing, vote] } };
              });
              break;
            case 'track:next':
              setGame(prev => ({ ...prev, currentTrackIndex: (msg.payload as any).newIndex }));
              break;
          }
        } catch (e) { console.warn('WS error', e); }
      }
    });
    return () => wsClientRef.current?.close();
  }, []);

  // Sync LocalStorage
  useEffect(() => {
    localStorage.setItem('qui_ecoute_ca_data', JSON.stringify(submissions));
    localStorage.setItem('qui_ecoute_ca_game', JSON.stringify(game));
  }, [submissions, game]);

  // Handlers
  const handleCreateGame = () => {
    const newCode = generateLobbyCode();
    const newGame: GameState = { ...game, status: 'setup', lobbyCode: newCode, participants: [], votes: {} };
    setGame(newGame);
    setSubmissions([]);
    setRole('admin');
    wsClientRef.current?.send({ type: 'game:update', payload: newGame });
  };

  const handleJoinGame = (code: string, name: string) => {
    const normalized = code.trim().toUpperCase();
    if (normalized === game.lobbyCode.toUpperCase()) {
      setRole('player');
      setPlayerName(name);
      localStorage.setItem('qui_ecoute_ca_name', name);
      wsClientRef.current?.send({ type: 'participant:joined', payload: { name, lobbyCode: normalized } });
    } else {
      setErrorMessage("Code invalide !");
    }
  };

  const addSubmission = async (url: string, manualTime: number) => {
    const videoId = extractVideoId(url);
    if (!videoId) return setErrorMessage("URL Invalide");
    setIsLoadingTitle(true);
    
    // ... logic fetch titre (simplifiée ici)
    const newSub: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      senderName: playerName,
      youtubeUrl: url,
      videoId,
      videoTitle: "Musique",
      startTime: manualTime || extractTimecode(url),
      timestamp: Date.now()
    };

    setSubmissions(prev => [...prev, newSub]);
    wsClientRef.current?.send({ type: 'submission:new', payload: { lobbyCode: game.lobbyCode, submission: newSub } });
    setIsLoadingTitle(false);
  };

  const startGame = () => {
    const newGame = { ...game, status: 'playing', shuffledPlaylist: shuffleArray(submissions) };
    setGame(newGame);
    wsClientRef.current?.send({ type: 'game:start', payload: newGame });
  };

  const handleVote = (guessedName: string) => {
    const newVote = { voterName: playerName, guessedName };
    wsClientRef.current?.send({ 
      type: 'vote:new', 
      payload: { lobbyCode: game.lobbyCode, trackIndex: game.currentTrackIndex, vote: newVote } 
    });
  };

  const nextTrack = () => {
    const isLast = game.currentTrackIndex >= game.shuffledPlaylist.length - 1;
    if (isLast) {
      const finishedGame = { ...game, status: 'finished' };
      setGame(finishedGame);
      wsClientRef.current?.send({ type: 'game:update', payload: finishedGame });
    } else {
      const newIndex = game.currentTrackIndex + 1;
      setGame(prev => ({ ...prev, currentTrackIndex: newIndex }));
      wsClientRef.current?.send({ type: 'track:next', payload: { lobbyCode: game.lobbyCode, newIndex } });
    }
  };

  return {
    role, playerName, game, submissions, errorMessage, isLoadingTitle,
    setErrorMessage, handleCreateGame, handleJoinGame, addSubmission, 
    startGame, handleVote, nextTrack, setRoundTimer: (s:number) => setGame(p=>({...p, roundTimer: s}))
  };
};