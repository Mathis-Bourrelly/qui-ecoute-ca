import { useState, useEffect, useRef, useCallback } from 'react';
import { Submission, GameState, UserRole, Vote } from '../types';
import { extractVideoId, extractTimecode, shuffleArray, generateLobbyCode, createWebSocketClient, WSMessage } from '../utils';

export const useGameLogic = () => {
  const [role, setRole] = useState<UserRole>('none');
  const [playerName, setPlayerName] = useState<string>(localStorage.getItem('qui_ecoute_ca_name') || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('qui_ecoute_ca_data');
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyCodeFromUrl = urlParams.get('code');

    if (lobbyCodeFromUrl) {
      // If there's a lobby code in the URL, assume a fresh start for submissions.
      // This helps clear submissions from a previous game if a player joins a new one.
      return [];
    }

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

  const [scores, setScores] = useState<Record<string, { correct: number; timesGuessed: number }>>({});

  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null);
  const gameRef = useRef<GameState>(game);

  // Synchronisation de la ref pour l'utiliser dans les callbacks WebSocket (évite le stale closure)
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Initialisation du WebSocket
  useEffect(() => {
    wsClientRef.current = createWebSocketClient({
      onMessage: (msg: WSMessage) => {
        try {
          if (!msg || !msg.type) return;

          const currentLobby = (gameRef.current?.lobbyCode || '').toString().trim().toUpperCase();

          switch (msg.type) {
            case 'game:update':
            case 'game:start':
              if (msg.payload) {
                    const newGameState = msg.payload as GameState & { _reset?: boolean };
                    setGame(newGameState);
                    // Only clear submissions when payload explicitly marks a reset (_reset === true)
                    if (newGameState.status === 'setup' && (newGameState as any)._reset === true) {
                      setSubmissions([]); // Clear player's submissions on explicit game reset
                    }
                  }
              break;

            case 'participant:joined': {
              const { name, lobbyCode } = msg.payload as any;
              if (lobbyCode?.toUpperCase() !== currentLobby) return;
              setGame(prev => ({
                ...prev,
                participants: Array.from(new Set([...(prev.participants || []), name]))
              }));
              break;
            }

            case 'submission:new': {
              const { submission: sub, lobbyCode: subLobby } = msg.payload as any;
              if (subLobby?.toUpperCase() !== currentLobby) return;
              setSubmissions(prev => {
                if (prev.some(s => s.id === sub.id)) return prev;
                return [...prev, sub];
              });
              // Ajouter aussi le participant s'il n'est pas là
              setGame(prev => ({
                ...prev,
                participants: Array.from(new Set([...(prev.participants || []), sub.senderName]))
              }));
              break;
            }

            case 'vote:new': {
              const { vote, trackIndex, lobbyCode: vLobby } = msg.payload as any;
              if (vLobby?.toUpperCase() !== currentLobby) return;
              
              setGame(prev => {
                const idx = Number(trackIndex); // Sécurité type
                const existing = prev.votes[idx] || [];
                if (existing.some(v => v.voterName === vote.voterName)) return prev;
                return { 
                  ...prev, 
                  votes: { ...prev.votes, [idx]: [...existing, vote] } 
                };
              });
              break;
            }

            case 'track:next': {
              const { newIndex, lobbyCode: nLobby } = msg.payload as any;
              if (nLobby?.toUpperCase() !== currentLobby) return;
              setGame(prev => ({ ...prev, currentTrackIndex: newIndex }));
              break;
            }

            case 'scores:update': {
              const { lobbyCode: sLobby, scores: newScores } = msg.payload as any;
              if (sLobby?.toUpperCase() !== currentLobby) return;
              setScores(newScores || {});
              break;
            }
          }
        } catch (e) {
          console.warn('Erreur lors du traitement du message WS:', e);
        }
      }
    });

    return () => wsClientRef.current?.close();
  }, []);

  // Persistance LocalStorage
  useEffect(() => {
    localStorage.setItem('qui_ecoute_ca_data', JSON.stringify(submissions));
    localStorage.setItem('qui_ecoute_ca_game', JSON.stringify(game));
  }, [submissions, game]);

  // Actions
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
    setSubmissions([]);
    setRole('admin');
    wsClientRef.current?.send({ type: 'game:update', payload: newGame });
  };

  const handleJoinGame = (code: string, name: string) => {
    const normalized = code.trim().toUpperCase();
    // On met à jour le lobbyCode local pour permettre la réception des messages
    setGame(prev => ({ ...prev, lobbyCode: normalized }));
    setRole('player');
    setPlayerName(name);
    localStorage.setItem('qui_ecoute_ca_name', name);  
    localStorage.removeItem('qui_ecoute_ca_data'); // Clear submissions from localStorage when a player joins a game
    
    wsClientRef.current?.send({ 
      type: 'participant:joined', 
      payload: { name, lobbyCode: normalized } 
    });
  };

  const addSubmission = async (url: string, manualTime: number) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setErrorMessage("L'URL YouTube est invalide !");
      return;
    }

    setIsLoadingTitle(true);
    let videoTitle = "Musique Mystère";
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      videoTitle = data.title || "Musique Mystère";
    } catch (e) {
      console.error(e);
    }

    const newSub: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      senderName: playerName,
      youtubeUrl: url,
      videoId,
      videoTitle,
      startTime: manualTime > 0 ? manualTime : extractTimecode(url),
      timestamp: Date.now()
    };

    setSubmissions(prev => [...prev, newSub]);
    wsClientRef.current?.send({ 
      type: 'submission:new', 
      payload: { lobbyCode: game.lobbyCode, submission: newSub } 
    });
    setIsLoadingTitle(false);
  };

  const startGame = () => {
    if (submissions.length === 0) return;
    const newGame: GameState = {
      ...game,
      status: 'playing',
      currentTrackIndex: 0,
      shuffledPlaylist: shuffleArray(submissions),
      votes: {},
    };
    setGame(newGame);
    wsClientRef.current?.send({ type: 'game:start', payload: newGame });
  };

  // MISE À JOUR OPTIMISTE ICI
  const handleVote = (guessedName: string) => {
    const trackIdx = game.currentTrackIndex;
    
    // 1. On vérifie localement si on a déjà voté
    const currentVotes = game.votes[trackIdx] || [];
    if (currentVotes.some(v => v.voterName === playerName)) return;

    const newVote: Vote = { voterName: playerName, guessedName };

    // 2. Mise à jour immédiate de l'état local (pour bloquer le bouton)
    setGame(prev => ({
      ...prev,
      votes: {
        ...prev.votes,
        [trackIdx]: [...(prev.votes[trackIdx] || []), newVote]
      }
    }));

    // 3. Envoi au serveur
    wsClientRef.current?.send({ 
      type: 'vote:new', 
      payload: { 
        lobbyCode: game.lobbyCode, 
        trackIndex: trackIdx, 
        vote: newVote 
      } 
    });
  };

  const nextTrack = () => {
    if (game.currentTrackIndex < game.shuffledPlaylist.length - 1) {
      const newIndex = game.currentTrackIndex + 1;
      setGame(prev => ({ ...prev, currentTrackIndex: newIndex }));
      wsClientRef.current?.send({ 
        type: 'track:next', 
        payload: { lobbyCode: game.lobbyCode, newIndex } 
      });
    } else {
      const finishedGame = { ...game, status: 'finished' };
      setGame(finishedGame);
      wsClientRef.current?.send({ type: 'game:update', payload: finishedGame });
    }
  };

  const resetGame = useCallback(() => {
    setSubmissions([]);
    setGame(prev => ({
      ...prev,
      status: 'setup',
      currentTrackIndex: 0,
      shuffledPlaylist: [],
      votes: {},
      // Keep existing lobbyCode and participants
    }));
    wsClientRef.current?.send({
      type: 'game:update',
      payload: {
        ...gameRef.current, // Use ref to get latest game state
        status: 'setup',
        currentTrackIndex: 0,
        shuffledPlaylist: [],
        votes: {},
        _reset: true,
      }
    });
  }, []);

  return {
    role,
    playerName,
    game,
    scores,
    submissions,
    errorMessage,
    isLoadingTitle,
    setErrorMessage,
    handleCreateGame,
    handleJoinGame,
    addSubmission,
    startGame,
    handleVote,
    nextTrack,
    resetGame,
    setRoundTimer: (seconds: number) => setGame(prev => ({ ...prev, roundTimer: seconds }))
  };
};