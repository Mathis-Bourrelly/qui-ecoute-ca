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
    <div className="h-screen w-full bg-slate-900 p-4 flex flex-col gap-4 overflow-hidden text-white">
      
      {/* HEADER BAR - Compacte */}
      <div className="h-[10%] flex justify-between items-center bg-indigo-900/80 p-4 rounded-2xl border-2 border-indigo-700 relative overflow-hidden shrink-0">
        {!revealed && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all duration-1000" 
            style={{ width: `${(timeLeft / game.roundTimer) * 100}%` }}
          />
        )}
        
        <div className="flex flex-col">
          <span className="text-yellow-400 text-[10px] font-black uppercase opacity-60">Étape</span>
          <span className="text-xl font-black italic uppercase leading-none">{game.currentTrackIndex + 1} / {game.shuffledPlaylist.length}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-yellow-400 text-[10px] font-black uppercase opacity-60">Chrono</span>
          <span className={`text-4xl font-black italic leading-none transition-colors ${timeLeft < 6 && !revealed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {revealed ? "STOP" : `${timeLeft}s`}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-yellow-400 text-[10px] font-black uppercase opacity-60">Votes reçus</span>
          <span className="text-xl font-black italic leading-none">{votes.length} / {game.participants.length}</span>
        </div>
      </div>

      {/* MAIN CONTENT - 2 Colonnes */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* COLONNE GAUCHE : VIDÉO (65%) */}
        <div className="flex-[1.8] relative bg-black rounded-3xl border-4 border-white/10 overflow-hidden shadow-2xl">
          <iframe 
            className="w-full h-full" 
            src={`https://www.youtube.com/embed/${track.videoId}?start=${track.startTime}&autoplay=1&controls=0&modestbranding=1&rel=0`} 
            allow="autoplay"
          />
          {!revealed && (
            <div className="absolute inset-0 bg-indigo-950 flex flex-col items-center justify-center text-center p-4">
               <div className="text-[10rem] mb-4 animate-spin-slow opacity-20 absolute">💿</div>
               <h2 className="text-6xl font-black text-white italic drop-shadow-lg uppercase tracking-tighter z-10">QUI ÉCOUTE ÇA ?</h2>
               <p className="text-yellow-400 mt-6 animate-pulse uppercase italic tracking-widest text-xl z-10">En attente des votes...</p>
            </div>
          )}
        </div>

        {/* COLONNE DROITE : RÉSULTATS (35%) */}
        <div className="flex-1 bg-white rounded-3xl border-b-[10px] border-indigo-900 flex flex-col overflow-hidden shadow-2xl">
          {revealed ? (
            <div className="flex-1 flex flex-col p-6 animate-in zoom-in duration-500 min-h-0">
              <div className="text-center shrink-0">
                <h3 className="text-indigo-900 font-black uppercase tracking-widest text-xs mb-2">TEMPS ÉCOULÉ ! C'ÉTAIT...</h3>
                <div className="bg-gradient-to-r from-pink-500 to-orange-500 py-4 px-6 rounded-2xl shadow-xl border-4 border-white inline-block mb-4">
                  <p className="text-3xl font-black text-white italic uppercase truncate max-w-xs">
                    {track.senderName}
                  </p>
                </div>
                
                <div className="p-3 bg-indigo-50 rounded-xl border-2 border-indigo-100 mb-4">
                  <p className="text-indigo-900 text-[10px] font-black uppercase opacity-60">Titre</p>
                  <p className="text-indigo-900 font-bold italic text-sm truncate uppercase">{track.videoTitle}</p>
                </div>
              </div>

              {/* Stats défilables si trop de participants */}
              <div className="flex-1 overflow-y-auto px-2 space-y-2 mb-4 scrollbar-hide">
                <h4 className="text-indigo-900 text-[10px] font-black uppercase tracking-widest border-b-2 border-indigo-100 pb-1 sticky top-0 bg-white">Votes du public :</h4>
                {game.participants.map(name => {
                  const percentage = votes.length > 0 ? ((stats[name] || 0) / votes.length) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-20 text-right text-indigo-900 font-black text-[10px] uppercase truncate">{name}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div className={`h-full transition-all duration-1000 ${name === track.senderName ? 'bg-green-500' : 'bg-indigo-400'}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-8 text-indigo-900 font-black text-[10px]">{Math.round(percentage)}%</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-auto pt-2 space-y-2 shrink-0">
                <button onClick={onNext} className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-4 rounded-2xl text-xl shadow-[0_5px_0_#b45309] active:translate-y-1 active:shadow-none transition-all uppercase italic border-2 border-white">
                  {isLast ? "RÉSULTATS 🏆" : "SUIVANT ➔"}
                </button>
                {isLast && (
                  <button onClick={resetGame} className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-2 rounded-xl text-sm uppercase italic border-2 border-white">
                    Rejouer
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
               <div className="text-8xl animate-bounce">🗳️</div>
               <p className="text-indigo-950 text-2xl font-black uppercase italic leading-tight">
                 Les votes sont ouverts<br/>sur mobile !
               </p>
               <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                 {game.participants.map((_, i) => (
                   <div key={i} className={`w-5 h-5 rounded-full border-2 transition-colors duration-500 ${i < votes.length ? 'bg-green-500 border-green-600' : 'bg-gray-100 border-indigo-100'}`} />
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGameView;