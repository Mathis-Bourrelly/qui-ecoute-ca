
import React, { useState, useEffect, useMemo } from 'react';
import { GameState } from '../types';

interface AdminGameViewProps {
  game: GameState;
  onNext: () => void;
}

const AdminGameView: React.FC<AdminGameViewProps> = ({ game, onNext }) => {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(game.roundTimer);
  const track = game.shuffledPlaylist[game.currentTrackIndex];
  const votes = game.votes[game.currentTrackIndex] || [];
  const isLast = game.currentTrackIndex === game.shuffledPlaylist.length - 1;

  // Reset quand on change de track
  useEffect(() => {
    setRevealed(false);
    setTimeLeft(game.roundTimer);
  }, [track, game.roundTimer]);

  // Timer logic
  useEffect(() => {
    if (revealed) return;

    // Auto-reveal si tout le monde a voté
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
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-indigo-900/80 p-3 md:p-4 rounded-2xl border-2 border-indigo-700 relative overflow-hidden">
        {/* Barre de progression du temps en fond */}
        {!revealed && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-yellow-400 transition-all duration-1000" 
            style={{ width: `${(timeLeft / game.roundTimer) * 100}%` }}
          />
        )}
        
        <div className="flex flex-col">
          <span className="text-yellow-400 text-[10px] md:text-xs font-black uppercase opacity-60">Étape</span>
          <span className="text-white text-xs md:text-base font-black italic uppercase leading-none">{game.currentTrackIndex + 1} / {game.shuffledPlaylist.length}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-yellow-400 text-[10px] md:text-xs font-black uppercase opacity-60">Chrono</span>
          <span className={`text-xl md:text-3xl font-black italic leading-none transition-colors ${timeLeft < 6 && !revealed ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {revealed ? "STOP" : `${timeLeft}s`}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-yellow-400 text-[10px] md:text-xs font-black uppercase opacity-60">Votes</span>
          <span className="text-white text-xs md:text-base font-black italic leading-none">{votes.length} / {game.participants.length}</span>
        </div>
      </div>

      <div className="relative aspect-video rounded-2xl md:rounded-[3rem] overflow-hidden border-4 md:border-[10px] border-white/10 bg-black shadow-2xl">
        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${track.videoId}?start=${track.startTime}&autoplay=1&controls=0&modestbranding=1&rel=0`} allow="autoplay"></iframe>
        {!revealed && (
          <div className="absolute inset-0 bg-indigo-950 flex flex-col items-center justify-center text-center p-4">
             <div className="text-7xl md:text-[12rem] mb-2 md:mb-4 animate-spin-slow drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">💿</div>
             <h2 className="text-xl md:text-4xl font-black text-white italic drop-shadow-lg uppercase tracking-tighter">QUI ÉCOUTE ÇA ?</h2>
             <p className="text-yellow-400 mt-4 animate-pulse uppercase italic tracking-widest text-xs md:text-sm">En attente des votes...</p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[3rem] border-b-8 md:border-b-[12px] border-indigo-900 shadow-2xl text-center">
        {revealed ? (
          <div className="animate-in zoom-in duration-500 space-y-4 md:space-y-6">
            <h3 className="text-indigo-900 font-black uppercase tracking-widest text-[10px] md:text-sm">TEMPS ÉCOULÉ ! C'ÉTAIT...</h3>
            <p className="text-3xl md:text-6xl font-black text-white bg-gradient-to-r from-pink-500 to-orange-500 py-3 md:py-6 rounded-2xl md:rounded-3xl shadow-xl border-2 md:border-4 border-white inline-block px-6 md:px-12 italic tracking-tighter uppercase break-words max-w-full">
              {track.senderName}
            </p>
            <div className="p-3 md:p-4 bg-indigo-50 rounded-xl md:rounded-2xl border-2 border-indigo-100 max-w-lg mx-auto">
              <p className="text-indigo-900 text-[8px] md:text-xs font-black uppercase tracking-widest opacity-60 mb-1">Titre de la vidéo</p>
              <p className="text-indigo-900 font-black italic text-sm md:text-lg leading-tight uppercase tracking-tight line-clamp-2">{track.videoTitle}</p>
            </div>
            <div className="mt-4 md:mt-8 space-y-2 max-w-md mx-auto">
              <h4 className="text-indigo-900 text-[10px] md:text-xs font-black uppercase tracking-widest text-left border-b-2 border-indigo-100 pb-1">Résultat du vote public :</h4>
              {game.participants.map(name => {
                const percentage = votes.length > 0 ? ((stats[name] || 0) / votes.length) * 100 : 0;
                return (
                  <div key={name} className="flex items-center gap-2 md:gap-3">
                    <span className="w-16 md:w-24 text-right text-indigo-900 font-black text-[10px] md:text-xs uppercase truncate">{name}</span>
                    <div className="flex-1 h-3 md:h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div className={`h-full transition-all duration-1000 ${name === track.senderName ? 'bg-green-500' : 'bg-indigo-400'}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-8 md:w-10 text-indigo-900 font-black text-[10px] md:text-xs">{Math.round(percentage)}%</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center pt-2">
              <button onClick={onNext} className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black px-8 py-4 md:px-12 md:py-5 rounded-full text-lg md:text-2xl shadow-[0_6px_0_#b45309] md:shadow-[0_8px_0_#b45309] active:translate-y-2 active:shadow-none transition-all uppercase italic border-2 md:border-4 border-white">
                {isLast ? "RÉSULTATS FINAUX 🏆" : "MUSIQUE SUIVANTE ➔"}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 space-y-4">
             <div className="text-6xl animate-bounce">🗳️</div>
             <p className="text-indigo-950 text-xl font-black uppercase italic tracking-tighter">Les votes sont ouverts sur mobile !</p>
             <div className="flex justify-center gap-2">
               {Array.from({length: game.participants.length}).map((_, i) => (
                 <div key={i} className={`w-4 h-4 rounded-full border-2 border-indigo-200 ${i < votes.length ? 'bg-green-500 border-green-600' : 'bg-gray-100'}`} />
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGameView;
