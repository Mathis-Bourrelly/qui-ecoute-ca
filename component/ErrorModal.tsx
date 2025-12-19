
import React from 'react';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/90 backdrop-blur-sm">
    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full border-[10px] border-red-500 text-center animate-in zoom-in duration-300">
      <div className="text-6xl mb-4">💥</div>
      <h3 className="text-red-600 text-2xl font-black uppercase italic mb-2 tracking-tighter">OUPSS...</h3>
      <p className="text-indigo-900 font-bold mb-6 uppercase text-sm">{message}</p>
      <button onClick={onClose} className="w-full bg-indigo-950 text-white font-black py-4 rounded-xl uppercase italic shadow-lg active:translate-y-1">D'ACCORD !</button>
    </div>
  </div>
);

export default ErrorModal;
