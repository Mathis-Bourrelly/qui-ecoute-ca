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
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-700 overflow-hidden">
      
      {/* 1. BARRE DE STATUT (TIMER) - PLEINE LARGEUR EN HAUT */}
      <div className="shrink-0 flex justify-between items-center bg-indigo-900/80 p-4 rounded-2xl border-2 border-indigo-700 relative overflow-hidden shadow-xl">
        {!revealed && (
          <div 
            className="absolute bottom-0 left-0 h-1.5 bg-yellow-400 transition-all duration-1000 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
            style={{ width: `${(timeLeft / game.roundTimer) * 100}%` }}
          />
        )}
        
        <div className="flex flex-col">
          <span className="text-yellow-400 text-xs font-black uppercase opacity-60">Étape</span>
          <span className="text-white text-xl font-black italic uppercase leading-none">
            {game.currentTrackIndex + 1} / {game.shuffledPlaylist.length}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-yellow-400 text-xs font-black uppercase opacity-60">Chronomètre</span>
          <span className={`text-4xl font-black italic leading-none transition-colors ${timeLeft < 6 && !revealed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {revealed ? "STOP" : `${timeLeft}s`}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-yellow-400 text-xs font-black uppercase opacity-60">Votes reçus</span>
          <span className="text-white text-xl font-black italic leading-none">
            {votes.length} / {game.participants.length}
          </span>
        </div>
      </div>

      {/* 2. GRILLE DEUX COLONNES - PREND TOUT L'ESPACE RESTANT */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* COLONNE GAUCHE : VIDÉO (7/12) */}
        <div className="col-span-7 h-full">
          <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border-8 border-white/10 bg-black shadow-2xl">
            <iframe 
              className="absolute inset-0 w-full h-full" 
              src={`https://www.youtube.com/embed/${track.videoId}?start=${track.startTime}&autoplay=1&controls=0&modestbranding=1&rel=0`} 
              allow="autoplay"
            ></iframe>
            {!revealed && (
              <div className="absolute inset-0 bg-indigo-950 flex flex-col items-center justify-center text-center p-4">
                 <div className="text-9xl mb-6 animate-spin-slow drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">💿</div>
                 <h2 className="text-5xl font-black text-white italic drop-shadow-lg uppercase tracking-tighter">QUI ÉCOUTE ÇA ?</h2>
                 <p className="text-yellow-400 mt-6 animate-pulse uppercase italic tracking-widest text-lg">En attente des votes sur mobile...</p>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : RÉSULTATS (5/12) */}
        <div className="col-span-5 h-full flex flex-col min-h-0 bg-white p-6 rounded-[2.5rem] border-b-[12px] border-indigo-900 shadow-2xl overflow-hidden">
          {revealed ? (
            <div className="h-full flex flex-col">
              <div className="text-center shrink-0 mb-4">
                <h3 className="text-indigo-900 font-black uppercase tracking-widest text-sm mb-2 opacity-60">C'ÉTAIT...</h3>
                <p className="text-4xl font-black text-white bg-gradient-to-r from-pink-500 to-orange-500 py-3 px-10 rounded-2xl shadow-xl border-4 border-white inline-block italic uppercase tracking-tighter">
                  {track.senderName}
                </p>
              </div>

              <div className="shrink-0 p-3 bg-indigo-50 rounded-xl border-2 border-indigo-100 text-center mb-4">
                <p className="text-indigo-900 text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Titre de la vidéo</p>
                <p className="text-indigo-900 font-black italic text-lg leading-tight uppercase line-clamp-1">{track.videoTitle}</p>
              </div>

              {/* Liste des votes scrollable si trop longue */}
              <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-2 custom-scrollbar">
                {game.participants.map(name => {
                  const percentage = votes.length > 0 ? ((stats[name] || 0) / votes.length) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-4">
                      <span className="w-24 text-right text-indigo-900 font-black text-xs uppercase truncate">{name}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
                        <div className={`h-full transition-all duration-1000 ${name === track.senderName ? 'bg-green-500' : 'bg-indigo-400'}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-10 text-indigo-900 font-black text-sm">{Math.round(percentage)}%</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Boutons d'action en bas */}
              <div className="shrink-0 flex flex-col gap-3">
                <button 
                  onClick={onNext} 
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-5 rounded-full text-2xl shadow-[0_6px_0_#b45309] active:translate-y-1 active:shadow-none transition-all uppercase italic border-4 border-white"
                >
                  {isLast ? "RÉSULTATS FINAUX 🏆" : "MUSIQUE SUIVANTE ➔"}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
               <div className="text-9xl animate-bounce mb-8">🗳️</div>
               <p className="text-indigo-950 text-3xl font-black uppercase italic text-center leading-tight mb-8">
                Les votes sont<br/>ouverts sur mobile !
               </p>
               <div className="flex flex-wrap justify-center gap-3 max-w-sm">
                 {game.participants.map((_, i) => (
                   <div key={i} className={`w-7 h-7 rounded-full border-4 shadow-inner transition-colors duration-500 ${i < votes.length ? 'bg-green-500 border-green-600' : 'bg-gray-100 border-indigo-100'}`} />
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