import React from 'react';

interface LayoutProps {
  lobbyCode: string;
  onReset: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ lobbyCode, onReset, children }) => (
  // h-screen + overflow-hidden pour figer l'écran
  <div className="h-screen w-screen bg-[#1e1b4b] text-white flex flex-col font-bold overflow-hidden p-2 md:p-4">
    <div className="w-full max-w-[98vw] mx-auto h-full flex flex-col">
      {/* Header avec shrink-0 pour ne pas s'écraser */}
      <header className="flex justify-between items-center mb-3 md:mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 md:p-4 rounded-2xl shadow-2xl border-b-4 border-orange-700 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-sm md:text-lg font-black text-indigo-950 uppercase italic leading-none">QUI ÉCOUTE ÇA ?</h1>
          <div className="mt-1 bg-indigo-900 px-2 py-0.5 rounded-lg flex items-center gap-2">
            <span className="text-[8px] text-yellow-400 font-black uppercase">PLATEAU</span>
            <span className="text-sm md:text-xl font-black text-white tracking-widest">#{lobbyCode || '----'}</span>
          </div>
        </div>
        <button onClick={onReset} className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-b-2 border-red-800 transition-colors">QUITTER</button>
      </header>

      {/* Main prend 100% de l'espace restant */}
      <main className="flex-1 min-h-0 relative">
        {children}
      </main>
    </div>
  </div>
);

export default Layout;