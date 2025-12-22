
import React from 'react';
import { Submission, GameState } from '../types';

interface AdminLobbyProps {
  submissions: Submission[];
  game: GameState;
  onStart: () => void;
  setTimer: (seconds: number) => void;
}

const AdminLobby: React.FC<AdminLobbyProps> = ({ submissions, game, onStart, setTimer }) => {
  // Génère l'URL de l'application avec le code de session pour le QR Code
  const joinUrl = `${window.location.origin}${window.location.pathname}?code=${game.lobbyCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinUrl)}`;
  
  const stats: Record<string, number> = {};
  submissions.forEach(s => stats[s.senderName] = (stats[s.senderName] || 0) + 1);

  const timerOptions = [15, 30, 45, 60];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-900/40 p-6 rounded-[2.5rem] border-2 border-indigo-500/30">
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic drop-shadow-lg leading-tight">CONFIGURATION</h2>
            <p className="text-indigo-300 text-xs uppercase font-bold tracking-widest mt-1">Paramètres du plateau</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-tighter">⏱️ Temps de vote (sec)</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 mr-2">
                {timerOptions.map(sec => (
                  <button 
                    key={sec}
                    onClick={() => setTimer(sec)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${game.roundTimer === sec ? 'bg-yellow-400 text-indigo-950' : 'bg-indigo-800 text-indigo-300 opacity-50'}`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
              <input 
                type="number" 
                value={game.roundTimer} 
                onChange={(e) => setTimer(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-20 bg-white border-4 border-indigo-500 rounded-xl px-2 py-2 text-center text-xl font-black text-indigo-900 outline-none focus:ring-4 ring-yellow-400/50 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {game.participants.length === 0 ? (
            <div className="col-span-full py-12 bg-white/5 border-4 border-dashed border-white/20 rounded-[2rem] text-center text-indigo-300 uppercase italic">En attente de candidats...</div>
          ) : (
            game.participants.map(name => (
              <div key={name} className="bg-white p-4 rounded-2xl border-b-4 border-gray-300 flex items-center justify-between">
                <span className="text-indigo-900 font-black text-xl italic">{name}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${stats[name] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stats[name] ? `${stats[name]} MUSIQUES` : 'AUCUN SON'}
                </span>
              </div>
            ))
          )}
        </div>
        <button 
          onClick={onStart} 
          disabled={submissions.length === 0} 
          className="w-full bg-green-500 hover:bg-green-400 text-indigo-900 font-black py-6 rounded-[2rem] shadow-[0_10px_0_#15803d] text-2xl uppercase italic active:translate-y-2 transition-all disabled:opacity-50"
        >
          LANCER L'ÉMISSION ! 🎬
        </button>
      </div>

      <div className="bg-indigo-900/50 p-8 rounded-[3rem] border-4 border-indigo-800 flex flex-col items-center text-center shadow-xl">
        <h3 className="text-yellow-400 font-black uppercase italic mb-4">Scanner pour Jouer</h3>
        <img src={qrUrl} alt="QR Code" className="bg-white p-4 rounded-3xl mb-4 shadow-2xl" />
        <p className="text-sm text-indigo-200 uppercase font-bold tracking-widest">OU UTILISEZ LE CODE</p>
        <p className="text-5xl font-black text-white tracking-widest mt-2">#{game.lobbyCode}</p>
      </div>
    </div>
  );
};

export default AdminLobby;
