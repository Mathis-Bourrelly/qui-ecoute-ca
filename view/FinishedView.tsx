
import React from 'react';

interface FinishedViewProps {
  onRestart: () => void;
  scores?: Record<string, { correct: number; timesGuessed: number }>;
  totalTracks?: number;
}

const FinishedView: React.FC<FinishedViewProps> = ({ onRestart, scores, totalTracks = 0 }) => {
  const entries = scores ? Object.entries(scores) : [];
  const bestGuessers = entries.slice().sort((a, b) => (b[1].correct - a[1].correct || a[0].localeCompare(b[0])));
  const leastGuessed = entries.slice().sort((a, b) => (a[1].timesGuessed - b[1].timesGuessed || a[0].localeCompare(b[0])));

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-[6rem]">🏆</div>
      <h2 className="text-4xl font-extrabold text-white mb-2 uppercase">RÉSULTATS FINALS</h2>
      <p className="text-indigo-300 mb-6">Résumé — {totalTracks} pistes jouées</p>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-lg text-white font-bold mb-3">Meilleurs devineurs</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-indigo-200 uppercase">
                <th className="p-2">#</th>
                <th className="p-2">Joueur</th>
                <th className="p-2">Bonnes réponses</th>
                <th className="p-2">Précision</th>
              </tr>
            </thead>
            <tbody>
              {bestGuessers.map(([name, s], i) => {
                const precision = totalTracks > 0 ? Math.round((s.correct / totalTracks) * 100) : 0;
                const rowClass = i === 0 ? 'bg-yellow-500/20' : i === 1 ? 'bg-indigo-400/10' : '';
                return (
                  <tr key={name} className={`${rowClass} border-b border-white/5`}>
                    <td className="p-2 font-bold text-white w-12">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                    <td className="p-2 text-white font-semibold">{name}</td>
                    <td className="p-2 text-white">{s.correct}</td>
                    <td className="p-2 text-white">{precision}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-lg text-white font-bold mb-3">Joueurs le moins devinés</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-indigo-200 uppercase">
                <th className="p-2">#</th>
                <th className="p-2">Joueur</th>
                <th className="p-2">Votes reçus</th>
                <th className="p-2">Bonnes réponses</th>
              </tr>
            </thead>
            <tbody>
              {leastGuessed.map(([name, s], i) => (
                <tr key={name} className={`border-b border-white/5`}>
                  <td className="p-2 font-bold text-white w-12">{i + 1}</td>
                  <td className="p-2 text-white font-semibold">{name}</td>
                  <td className="p-2 text-white">{s.timesGuessed}</td>
                  <td className="p-2 text-white">{s.correct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* If no scores (clients), show a neutral note that results are on the TV */}
      {entries.length === 0 && (
        <p className="text-indigo-300">Les résultats sont affichés sur l'écran principal.</p>
      )}

      <div className="mt-8">
        <button onClick={onRestart} className="bg-green-500 text-white font-black px-8 py-3 rounded-full text-lg shadow-[0_6px_0_#15803d] hover:scale-105 transition-all">RETOUR AU MENU</button>
      </div>
    </div>
  );
};

export default FinishedView;
