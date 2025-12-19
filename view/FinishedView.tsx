
import React from 'react';

interface FinishedViewProps {
  onRestart: () => void;
}

const FinishedView: React.FC<FinishedViewProps> = ({ onRestart }) => (
  <div className="min-h-screen bg-[#1e1b4b] flex flex-col items-center justify-center p-6 text-center">
    <div className="text-[10rem] animate-spin-slow">💿</div>
    {/* Fixed missing '>' after className attribute */}
    <h2 className="text-6xl font-black text-white mb-6 uppercase italic tracking-tighter leading-none">FIN !</h2>
    <p className="text-indigo-200 text-xl mb-10 font-bold max-w-md uppercase tracking-tight">L'émission est terminée. Merci d'avoir partagé vos musiques !</p>
    <button onClick={onRestart} className="bg-green-500 text-white font-black px-12 py-6 rounded-[2rem] text-2xl shadow-[0_10px_0_#15803d] hover:scale-110 active:translate-y-2 active:shadow-none transition-all uppercase italic border-4 border-white">RETOUR AU MENU</button>
  </div>
);

export default FinishedView;
