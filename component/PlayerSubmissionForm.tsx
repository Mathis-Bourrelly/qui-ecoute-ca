
import React, { useState } from 'react';

interface PlayerSubmissionFormProps {
  playerName: string;
  onSubmit: (url: string, time: number) => void;
  submissionCount: number;
  isProcessing: boolean;
}

const PlayerSubmissionForm: React.FC<PlayerSubmissionFormProps> = ({ playerName, onSubmit, submissionCount, isProcessing }) => {
  const [url, setUrl] = useState('');
  const [time, setTime] = useState('');

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white uppercase italic mb-1 tracking-tighter">BIENVENUE {playerName} !</h2>
        <p className="text-indigo-200 font-bold uppercase text-xs">Envoie tes pépites (ou tes hontes)</p>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-b-[12px] border-indigo-900 space-y-5">
        <div className="bg-indigo-50 p-4 rounded-2xl flex justify-between items-center border-2 border-indigo-100">
           <span className="text-indigo-900 text-xs font-black uppercase italic">Tes envois</span>
           <span className="bg-indigo-900 text-white px-3 py-1 rounded-full font-black">{submissionCount}</span>
        </div>
        <input 
          type="text" 
          placeholder="COLLER LIEN YOUTUBE" 
          value={url} 
          onChange={e => setUrl(e.target.value)} 
          className="w-full bg-gray-100 border-4 border-gray-200 rounded-xl px-4 py-3 text-indigo-900 font-black outline-none focus:border-indigo-500 transition-all" 
        />
        <input 
          type="number" 
          placeholder="TIMECODE (SEC)" 
          value={time} 
          onChange={e => setTime(e.target.value)} 
          className="w-full bg-gray-100 border-4 border-gray-200 rounded-xl px-4 py-3 text-indigo-900 font-black outline-none focus:border-indigo-500 transition-all" 
        />
        <button 
          onClick={() => { onSubmit(url, parseInt(time || '0')); setUrl(''); setTime(''); }} 
          disabled={isProcessing || !url} 
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-[0_6px_0_#9a3412] active:translate-y-1 active:shadow-none transition-all uppercase italic flex items-center justify-center gap-2"
        >
          {isProcessing ? "RÉCUPÉRATION... 🔄" : "ENVOYER AU RÉGIE ! 📢"}
        </button>
      </div>
    </div>
  );
};

export default PlayerSubmissionForm;
