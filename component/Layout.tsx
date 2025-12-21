import React from 'react';

interface LayoutProps {
  lobbyCode: string;
  onReset: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ lobbyCode, onReset, children }) => (
  <div className="h-screen w-screen bg-[#1e1b4b] text-white flex flex-col font-bold overflow-hidden p-4">
    <div className="w-full max-w-[95vw] mx-auto h-full flex flex-col">
      <header className="flex justify-between items-center mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-2xl shadow-2xl border-b-4 border-orange-700 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-indigo-950 uppercase italic leading-none">QUI ÉCOUTE ÇA ?</h1>
          <div className="mt-1 bg-indigo-900 px-3 py-1 rounded-lg flex items-center gap-2 inline-flex self-start">
            <span className="text-[10px] text-yellow-400 font-black uppercase">PLATEAU</span>
            <span className="text-xl font-black text-white tracking-widest">#{lobbyCode || '----'}</span>
          </div>
        </div>
        <button onClick={onReset} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl text-xs font-black uppercase border-b-4 border-red-800 transition-colors">
          QUITTER LA PARTIE
        </button>
      </header>

      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  </div>
);

export default Layout;