import React from 'react';

interface LayoutProps {
  lobbyCode: string;
  onReset: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ lobbyCode, onReset, children }) => (
  <div className="min-h-screen min-h-[100dvh] bg-[#1e1b4b] text-white flex flex-col font-bold overflow-x-hidden">
    <div className="w-full max-w-4xl mx-auto px-3 md:px-4 flex-1 flex flex-col">
      <header className="flex justify-between items-center my-4 md:my-6 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 md:p-5 rounded-2xl shadow-2xl border-b-4 border-orange-700">
        <div className="flex flex-col">
          <h1 className="text-sm md:text-lg font-black text-indigo-950 uppercase italic leading-none">QUI ÉCOUTE ÇA ?</h1>
          <div className="mt-1 bg-indigo-900 px-2 py-0.5 rounded-lg flex items-center gap-2">
            <span className="text-[7px] md:text-[9px] text-yellow-400 font-black uppercase">PLATEAU</span>
            <span className="text-sm md:text-xl font-black text-white tracking-widest">#{lobbyCode || '----'}</span>
          </div>
        </div>
        <button onClick={onReset} className="bg-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-b-2 border-red-800">QUITTER</button>
      </header>
      <main className="flex-1 pb-8">{children}</main>
    </div>
  </div>
);

export default Layout;