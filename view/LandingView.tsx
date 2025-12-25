
import React, { useState } from 'react';

interface LandingViewProps {
  onCreate: () => void;
  onJoin: (code: string, name: string) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onCreate, onJoin }) => {
  // Récupère le code depuis l'URL s'il existe
  const [code, setCode] = useState(() => (new URLSearchParams(window.location.search).get('code') || '').toUpperCase());
  const [name, setName] = useState(localStorage.getItem('qui_ecoute_ca_name') || '');

  return (
    <div className="min-h-screen bg-[#1e1b4b] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-12 animate-soft-bounce">
        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
          <span className="block text-yellow-400 drop-shadow-[0_5px_0_#b45309]">QUI</span>
          <span className="block text-white drop-shadow-[0_5px_0_#4f46e5]">ÉCOUTE</span>
          <span className="block text-orange-500 drop-shadow-[0_5px_0_#9a3412]">ÇA ?</span>
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        <button onClick={onCreate} className="bg-indigo-600 hover:bg-indigo-500 p-8 rounded-[3rem] border-b-8 border-indigo-900 active:translate-y-2 active:border-b-0 transition-all shadow-xl flex flex-col items-center group">
          <span className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">📺</span>
          <span className="text-2xl font-black text-white uppercase italic">PRÉSENTATEUR</span>
          <span className="text-sm text-indigo-300 mt-2 uppercase tracking-tighter">Écran Principal</span>
        </button>
        <div className="bg-orange-500 p-8 rounded-[3rem] border-b-8 border-orange-800 shadow-xl flex flex-col gap-4">
          <span className="text-5xl">📱</span>
          <span className="text-2xl font-black text-white uppercase italic">REJOINDRE</span>
          <input 
            type="text" 
            placeholder="TON NOM" 
            value={name} 
            onChange={(e) => setName(e.target.value.toUpperCase())} 
            className="w-full bg-white border-4 border-orange-700 rounded-2xl px-4 py-3 text-center text-xl font-black text-indigo-900 uppercase" 
          />
          <input 
            type="numeric" 
            placeholder="CODE PLATEAU" 
            value={code} 
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4).toUpperCase())} 
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full bg-white border-4 border-orange-700 rounded-2xl px-4 py-3 text-center text-2xl font-black text-orange-600" 
          />
          <button 
            onClick={() => onJoin(code.toUpperCase(), name)} 
            disabled={!name || code.length !== 4} 
            className="w-full bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all uppercase italic shadow-lg active:translate-y-1"
          >
            ENTRER EN SCÈNE
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingView;
