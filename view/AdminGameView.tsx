import React, { useState, useEffect, useMemo } from 'react';
import { GameState } from '../types';

interface AdminGameViewProps {
  game: GameState;
  onNext: () => void;
  resetGame: () => void;
}

const AdminGameView: React.FC<AdminGameViewProps> = ({ game, onNext, resetGame }) => {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(game.roundTimer);
  const track = game.shuffledPlaylist[game.currentTrackIndex];
  const votes = game.votes[game.currentTrackIndex] || [];
  const isLast = game.currentTrackIndex === game.shuffledPlaylist.length - 1;

  useEffect(() => {
    setRevealed(false);
    setTimeLeft(game.roundTimer);
  }, [track, game.roundTimer]);

  useEffect(() => {
    if (revealed) return;
    if (votes.length > 0 && votes.length === game.participants.length) {
      setRevealed(true);
      return;
    }
    if (timeLeft <= 0) {
      setRevealed(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, revealed, votes.length, game.participants.length]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    votes.forEach(v => counts[v.guessedName] = (counts[v.guessedName] || 0) + 1);
    return counts;
  }, [votes]);

  return (
    <div className="h-screen w-full bg-slate-950 flex overflow-hidden font-sans">
      
      {/* GAUCHE : LECTEUR VIDÉO (65%) */}
      <div className="w-[65%] h-full relative bg-black border-r border-white/10">
        <iframe 
          className="w-full h-full" 
          src={`https://www.youtube.com/embed/${track.videoId}?start=${track.startTime}&autoplay=1&controls=0&modestbranding=1&rel=0`} 
          allow="autoplay"
        ></iframe>

        {!revealed && (
          <div className="absolute inset-0 bg-indigo-950 flex flex-col items-center justify-center text-center">
            <div className="text-[15vh] animate-pulse opacity-20 absolute">🎵</div>
            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter z-10">QUI ÉCOUTE ÇA ?</h2>
            <div className="flex gap-2 mt-6 z-10">
                {Array.from({length: game.participants.length}).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i < votes.length ? 'bg-green-400 scale-125 shadow-lg' : 'bg-white/20'}`} />
                ))}
            </div>
          </div>
        )}

        {/* Timer Progress Bar (Bottom of Video) */}
        {!revealed && (
          <div className="absolute bottom-0 left-0 w-full h-2 bg-black/40">
            <div 
              className="h-full bg-yellow-400 transition-all duration-1000 ease-linear" 
              style={{ width: `${(timeLeft / game.roundTimer) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* DROITE : RESULTATS (35%) */}
      <div className="w-[35%] h-full bg-white flex flex-col">
        
        {/* Header Compact */}
        <div className="px-4 py-3 bg-indigo-900 text-white flex justify-between items-center">
            <span className="font-black italic uppercase text-sm">Round {game.currentTrackIndex + 1}/{game.shuffledPlaylist.length}</span>
            <span className={`font-black text-xl ${timeLeft < 6 && !revealed ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                {revealed ? "FINI" : `${timeLeft}s`}
            </span>
        </div>

        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {revealed ? (
            <div className="h-full flex flex-col">
              
              {/* Gagnant Section */}
              <div className="mb-4">
                <p className="text-indigo-900/50 text-[10px] font-black uppercase mb-1">La pépite de :</p>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-xl shadow-lg border-b-4 border-indigo-800">
                  <p className="text-2xl font-black text-white italic uppercase truncate text-center">
                    {track.senderName}
                  </p>
                </div>
                <p className="mt-2 text-indigo-900 font-bold text-xs italic opacity-80 truncate px-1">
                   "{track.videoTitle}"
                </p>
              </div>

              {/* Stats Section - Scrollable */}
              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <p className="text-indigo-900/40 text-[10px] font-black uppercase border-b pb-1 mb-2">Votes des joueurs</p>
                <div className="space-y-2">
                    {game.participants.map(name => {
                    const percentage = votes.length > 0 ? ((stats[name] || 0) / votes.length) * 100 : 0;
                    return (
                        <div key={name} className="flex items-center gap-2">
                            <span className="w-20 text-right text-indigo-900 font-bold text-[10px] uppercase truncate">{name}</span>
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${name === track.senderName ? 'bg-green-500' : 'bg-indigo-300'}`} 
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="w-8 text-indigo-900 font-bold text-[10px]">{Math.round(percentage)}%</span>
                        </div>
                    );
                    })}
                </div>
              </div>

              {/* Action Button - Fixé en bas */}
              <div className="mt-4">
                <button 
                  onClick={onNext} 
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-4 rounded-xl text-lg shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none transition-all uppercase italic border-2 border-white"
                >
                  {isLast ? "RÉSULTATS 🏆" : "SUIVANT ➔"}
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
               <div className="text-6xl mb-4 animate-bounce">🗳️</div>
               <p className="text-indigo-900 text-xl font-black uppercase italic leading-tight">
                 Réception des votes...
               </p>
               <div className="mt-4 bg-indigo-50 w-full py-4 rounded-2xl border-2 border-dashed border-indigo-200">
                    <span className="text-4xl font-black text-indigo-900 italic">
                        {votes.length} / {game.participants.length}
                    </span>
               </div>
               <p className="mt-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Joueurs connectés</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGameView;