
import React from 'react';

interface FinishedViewProps {
  onRestart: () => void;
  scores?: Record<string, { correct: number; timesGuessed: number }>;
}

const FinishedView: React.FC<FinishedViewProps> = ({ onRestart, scores }) => {
  const entries = scores ? Object.entries(scores) : [];
  const bestGuessers = entries.slice().sort((a, b) => (b[1].correct - a[1].correct));
  const leastGuessed = entries.slice().sort((a, b) => (a[1].timesGuessed - b[1].timesGuessed));

  return (
    <div className="min-h-screen bg-[#1e1b4b] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-[10rem] animate-spin-slow">💿</div>
      <h2 className="text-6xl font-black text-white mb-6 uppercase italic tracking-tighter leading-none">FIN !</h2>
      <p className="text-indigo-200 text-xl mb-6 font-bold max-w-md uppercase tracking-tight">L'émission est terminée. Merci d'avoir partagé vos musiques !</p>

      {entries.length > 0 ? (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 p-6 rounded-lg">
            <h3 className="text-xl text-white font-bold mb-4">Meilleurs devineurs (plus de bonnes réponses)</h3>
            <ol className="list-decimal list-inside text-left text-white/90">
              {bestGuessers.map(([name, s]) => (
                <li key={name} className="mb-2">{name} — {s.correct} bonnes réponses</li>
              ))}
            </ol>
          </div>

          <div className="bg-white/5 p-6 rounded-lg">
            <h3 className="text-xl text-white font-bold mb-4">Moins devinés (reçus le moins de votes)</h3>
            <ol className="list-decimal list-inside text-left text-white/90">
              {leastGuessed.map(([name, s]) => (
                <li key={name} className="mb-2">{name} — {s.timesGuessed} votes reçus</li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <p className="text-indigo-200 text-lg mb-8">Les résultats ne sont pas encore disponibles.</p>
      )}

      <button onClick={onRestart} className="bg-green-500 text-white font-black px-12 py-6 rounded-[2rem] text-2xl shadow-[0_10px_0_#15803d] hover:scale-110 active:translate-y-2 active:shadow-none transition-all uppercase italic border-4 border-white">RETOUR AU MENU</button>
    </div>
  );
};

export default FinishedView;
