
import React, { useState, useEffect } from 'react';
import { Submission, GameState, UserRole, Vote } from './types';
import { extractVideoId, extractTimecode, shuffleArray, generateLobbyCode } from './utils';

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
      lobbyCode: generateLobbyCode(),
      participants: [],
      votes: {},
      roundTimer: 30,
    };
  });

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

  const handleCreateGame = () => {
    const newCode = generateLobbyCode();
    setGame({ 
      status: 'setup', 
      lobbyCode: newCode, 
      currentTrackIndex: 0, 
      shuffledPlaylist: [], 
      participants: [], 
      votes: {},
      roundTimer: 30
    });
    setSubmissions([]);
    setRole('admin');
  };

  const setRoundTimer = (seconds: number) => {
    setGame(prev => ({ ...prev, roundTimer: seconds }));
  };

  const handleJoinGame = (code: string, name: string) => {
    if (code === game.lobbyCode) {
      if (!name) return setErrorMessage("Choisis un nom de scène !");
      setRole('player');
      setPlayerName(name);
      localStorage.setItem('qui_ecoute_ca_name', name);
      
      if (!game.participants.includes(name)) {
        setGame(prev => ({ ...prev, participants: [...prev.participants, name] }));
      }
    } else {
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
  };

  const startGame = () => {
    if (submissions.length < 1) return;
    const allSenders = Array.from(new Set(submissions.map(s => s.senderName)));
    setGame(prev => ({
      ...prev,
      status: 'playing',
      currentTrackIndex: 0,
      participants: Array.from(new Set([...prev.participants, ...allSenders])),
      shuffledPlaylist: shuffleArray(submissions),
      votes: {},
    }));
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
  };

  const nextTrack = () => {
    if (game.currentTrackIndex < game.shuffledPlaylist.length - 1) {
      setGame(prev => ({ ...prev, currentTrackIndex: prev.currentTrackIndex + 1 }));
    } else {
      setGame(prev => ({ ...prev, status: 'finished' }));
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
              <span className="text-sm md:text-xl font-black text-white tracking-widest leading-none">#{game.lobbyCode}</span>
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
