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
    <div className="grid grid-cols-12 gap-4 h-full animate-in fade-in duration-700">
      
      {/* GAUCHE : VIDÉO (Prend toute la hauteur disponible) */}
      <div className="col-span-7 h-full flex flex-col">
        <div className="relative w-full h-full rounded-[2rem] overflow-hidden border-4 md:border-8 border-white/10 bg-black shadow-2xl">
          <iframe 
            className="absolute inset-0 w-full h-full" 
            src={`https://www.youtube.com/embed/${track.videoId}?start=${track.startTime}&autoplay=1&controls=0&modestbranding=1&rel=0`} 
            allow="autoplay"
          ></iframe>
          {!revealed && (
            <div className="absolute inset-0 bg-indigo-950 flex flex-col items-center justify-center text-center p-4">
               <div className="text-6xl md:text-9xl mb-4 animate-spin-slow drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">💿</div>
               <h2 className="text-2xl md:text-4xl font-black text-white italic drop-shadow-lg uppercase tracking-tighter">QUI ÉCOUTE ÇA ?</h2>
               <p className="text-yellow-400 mt-4 animate-pulse uppercase italic tracking-widest text-xs">En attente des votes...</p>
            </div>
          )}
        </div>
      </div>

      {/* DROITE : INFOS & RÉSULTATS */}
      <div className="col-span-5 flex flex-col gap-3 h-full overflow-hidden">
        
        {/* Status bar (hauteur fixe) */}
        <div className="shrink-0 flex justify-between items-center bg-indigo-900/80 p-3 rounded-xl border-2 border-indigo-700 relative overflow-hidden">
          {!revealed && (
            <div className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all duration-1000" 
                 style={{ width: `${(timeLeft / game.roundTimer) * 100}%` }} />
          )}
          <div className="flex flex-col text-left">
            <span className="text-yellow-400 text-[8px] font-black uppercase opacity-60 leading-none">Étape</span>
            <span className="text-white text-sm font-black italic">{game.currentTrackIndex + 1}/{game.shuffledPlaylist.length}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-2xl font-black italic leading-none ${timeLeft < 6 && !revealed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {revealed ? "STOP" : `${timeLeft}s`}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-yellow-400 text-[8px] font-black uppercase opacity-60 leading-none">Votes</span>
            <span className="text-white text-sm font-black italic">{votes.length}/{game.participants.length}</span>
          </div>
        </div>

        {/* Panneau de résultats (remplit le reste du flex) */}
        <div className="flex-1 min-h-0 bg-white p-4 rounded-[2rem] border-b-8 border-indigo-900 shadow-2xl flex flex-col">
          {revealed ? (
            <div className="h-full flex flex-col">
              <div className="text-center shrink-0 mb-3">
                <h3 className="text-indigo-900 font-black uppercase tracking-widest text-[10px] mb-1">C'ÉTAIT...</h3>
                <p className="text-xl md:text-2xl font-black text-white bg-gradient-to-r from-pink-500 to-orange-500 py-2 px-6 rounded-xl shadow-lg border-2 border-white inline-block italic uppercase">
                  {track.senderName}
                </p>
              </div>

              <div className="shrink-0 p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-center mb-3">
                <p className="text-indigo-900 font-black italic text-[11px] leading-tight uppercase line-clamp-1">{track.videoTitle}</p>
              </div>

              {/* Liste des votes : LA SEULE ZONE QUI SCROLLE SI BESOIN */}
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                {game.participants.map(name => {
                  const percentage = votes.length > 0 ? ((stats[name] || 0) / votes.length) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span className="w-16 text-right text-indigo-900 font-black text-[9px] uppercase truncate">{name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div className={`h-full transition-all duration-1000 ${name === track.senderName ? 'bg-green-500' : 'bg-indigo-400'}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-7 text-indigo-900 font-black text-[9px]">{Math.round(percentage)}%</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-3 shrink-0">
                <button onClick={onNext} className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-3 rounded-full text-lg shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none transition-all uppercase italic border-2 border-white">
                  {isLast ? "RÉSULTATS 🏆" : "SUIVANT ➔"}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
               <div className="text-7xl animate-bounce mb-4">🗳️</div>
               <p className="text-indigo-950 text-xl font-black uppercase italic text-center leading-tight mb-4">
                Les votes sont ouverts !
               </p>
               <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
                 {game.participants.map((_, i) => (
                   <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < votes.length ? 'bg-green-500 border-green-600' : 'bg-gray-100 border-indigo-100'}`} />
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