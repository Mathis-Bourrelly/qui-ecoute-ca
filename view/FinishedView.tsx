
import React from 'react';

interface FinishedViewProps {
  onRestart: () => void;
  scores?: Record<string, { correct: number; timesGuessed: number }>;
  totalTracks?: number;
}

const FinishedView: React.FC<FinishedViewProps> = ({ onRestart, scores, totalTracks = 0 }) => {
  const entries = scores ? Object.entries(scores) : [];
  const ranked = entries.slice().sort((a, b) => (b[1].correct - a[1].correct || a[0].localeCompare(b[0])));

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-[8rem]">🏆</div>
      <h2 className="text-5xl font-extrabold text-white mb-4 uppercase">RÉSULTATS FINALS</h2>
      <p className="text-indigo-300 mb-8">Classement des joueurs — {totalTracks} pistes jouées</p>

      {ranked.length > 0 ? (
        <div className="w-full max-w-3xl bg-white/5 rounded-xl p-4">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="text-sm text-indigo-200 uppercase">
                <th className="p-3">#</th>
                <th className="p-3">Joueur</th>
                <th className="p-3">Bonnes réponses</th>
                <th className="p-3">Votes reçus</th>
                <th className="p-3">Précision</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(([name, s], i) => {
                const precision = totalTracks > 0 ? Math.round((s.correct / totalTracks) * 100) : 0;
                const rowClass = i === 0 ? 'bg-yellow-500/20' : i === 1 ? 'bg-indigo-400/10' : '';
                return (
                  <tr key={name} className={`${rowClass} border-b border-white/5`}>
                    <td className="p-3 align-middle font-bold text-white w-12">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                    <td className="p-3 align-middle text-white font-semibold">{name}</td>
                    <td className="p-3 align-middle text-white">{s.correct}</td>
                    <td className="p-3 align-middle text-white">{s.timesGuessed}</td>
                    <td className="p-3 align-middle text-white">{precision}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-indigo-200 text-lg mb-8">Les résultats ne sont pas encore disponibles.</p>
      )}

      <div className="mt-8">
        <button onClick={onRestart} className="bg-green-500 text-white font-black px-8 py-3 rounded-full text-lg shadow-[0_6px_0_#15803d] hover:scale-105 transition-all">RETOUR AU MENU</button>
      </div>
    </div>
  );
};

export default FinishedView;
