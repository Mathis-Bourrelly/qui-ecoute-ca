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
    <div className="h-screen w-full bg-indigo-950 flex overflow-hidden border-4 border-indigo-900">
      
      {/* COLONNE GAUCHE : LE LECTEUR / VISUEL (60%) */}
      <div className="w-[60%] h-full relative border-r-4 border-indigo-900 bg-black">
        <iframe 
          className="w-full h-full object-cover" 
          src={`https://www.youtube.com/embed/${track.videoId}?start=${track.startTime}&autoplay=1&controls=0&modestbranding=1&rel=0`} 
          allow="autoplay"
        ></iframe>

        {/* Overlay si non révélé */}
        {!revealed && (
          <div className="absolute inset-0 bg-indigo-900 flex flex-col items-center justify-center text-center p-8">
            <div className="text-[12rem] animate-spin-slow opacity-30 absolute">💿</div>
            <div className="relative z-10">
                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-4 drop-shadow-2xl">
                    QUI ÉCOUTE ÇA ?
                </h2>
                <div className="flex gap-3 justify-center">
                    {Array.from({length: game.participants.length}).map((_, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-500 ${i < votes.length ? 'bg-green-400 border-white scale-125 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'bg-white/10 border-transparent'}`} />
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* Barre de temps en bas de la vidéo */}
        {!revealed && (
          <div className="absolute bottom-0 left-0 w-full h-3 bg-white/10">
            <div 
              className="h-full bg-yellow-400 transition-all duration-1000 ease-linear shadow-[0_0_20px_#facc15]" 
              style={{ width: `${(timeLeft / game.roundTimer) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* COLONNE DROITE : INFOS & VOTES (40%) */}
      <div className="w-[40%] h-full bg-white flex flex-col overflow-hidden relative">
        
        {/* Header de la colonne */}
        <div className="p-6 bg-indigo-50 border-b-2 border-indigo-100 flex justify-between items-center">
            <div>
                <p className="text-indigo-900/50 text-[10px] font-black uppercase">Manche</p>
                <p className="text-indigo-900 text-2xl font-black italic">{game.currentTrackIndex + 1} / {game.shuffledPlaylist.length}</p>
            </div>
            <div className="text-right">
                <p className="text-indigo-900/50 text-[10px] font-black uppercase">Chrono</p>
                <p className={`text-3xl font-black italic ${timeLeft < 6 && !revealed ? 'text-red-500 animate-pulse' : 'text-indigo-900'}`}>
                    {revealed ? "STOP" : `${timeLeft}s`}
                </p>
            </div>
        </div>

        {/* Corps de la colonne */}
        <div className="flex-1 p-6 flex flex-col overflow-hidden">
          {revealed ? (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="mb-6">
                <h3 className="text-indigo-900 font-black uppercase tracking-widest text-xs mb-2 opacity-60">La réponse était...</h3>
                <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 p-6 rounded-3xl shadow-xl transform -rotate-1 border-4 border-white">
                  <p className="text-4xl font-black text-white italic uppercase truncate text-center">
                    {track.senderName}
                  </p>
                </div>
                <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-indigo-900 font-bold text-sm leading-tight uppercase line-clamp-2 italic">
                        "{track.videoTitle}"
                    </p>
                </div>
              </div>

              {/* Liste des votes scrollable si trop longue */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h4 className="text-indigo-900 text-[10px] font-black uppercase border-b-2 border-indigo-100 pb-2 mb-3">Répartition des votes :</h4>
                <div className="space-y-3">
                    {game.participants.map(name => {
                    const percentage = votes.length > 0 ? ((stats[name] || 0) / votes.length) * 100 : 0;
                    return (
                        <div key={name} className="flex items-center gap-3">
                        <span className="w-24 text-right text-indigo-900 font-black text-[11px] uppercase truncate">{name}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div 
                                className={`h-full transition-all duration-1000 ${name === track.senderName ? 'bg-green-500' : 'bg-indigo-400'}`} 
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="w-10 text-indigo-900 font-black text-xs">{Math.round(percentage)}%</span>
                        </div>
                    );
                    })}
                </div>
              </div>

              {/* Bouton d'action fixe en bas */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button 
                  onClick={onNext} 
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-5 rounded-2xl text-2xl shadow-[0_8px_0_#b45309] active:translate-y-1 active:shadow-none transition-all uppercase italic border-2 border-white"
                >
                  {isLast ? "RÉSULTATS FINAUX 🏆" : "SUIVANT ➔"}
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
               <div className="text-9xl mb-6 animate-bounce">🗳️</div>
               <p className="text-indigo-900 text-3xl font-black uppercase italic leading-tight mb-2">
                 Votes en cours...
               </p>
               <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-8">
                 {votes.length} sur {game.participants.length} joueurs ont voté
               </p>
               
               <div className="w-full max-w-xs bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-100">
                    <div className="text-5xl font-black text-indigo-900 italic">
                        {Math.round((votes.length / game.participants.length) * 100)}%
                    </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGameView;