import React from 'react';

interface LayoutProps {
  lobbyCode: string;
  onReset: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ lobbyCode, onReset, children }) => (
  <div className="h-screen w-screen bg-[#1e1b4b] text-white flex flex-col font-bold overflow-hidden p-4 md:p-6">
    <div className="w-full h-full flex flex-col max-w-[1600px] mx-auto">
      {/* Header compact */}
      <header className="flex justify-between items-center mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-3xl shadow-2xl border-b-4 border-orange-700 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-indigo-950 uppercase italic leading-none">QUI ÉCOUTE ÇA ?</h1>
          <div className="mt-1 bg-indigo-900 px-3 py-1 rounded-xl flex items-center gap-2 self-start">
            <span className="text-[10px] text-yellow-400 font-black">PLATEAU</span>
            <span className="text-xl font-black text-white tracking-widest">#{lobbyCode || '----'}</span>
          </div>
        </div>
        <button onClick={onReset} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-2xl text-sm font-black uppercase border-b-4 border-red-900 transition-all active:scale-95">QUITTER</button>
      </header>

      {/* Zone de contenu */}
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  </div>
);

export default Layout;