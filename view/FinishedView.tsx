
import React from 'react';
import { UserRole } from '../types';

interface FinishedViewProps {
  onRestart: () => void;
  scores?: Record<string, { correctMade?: number; correctReceived?: number; submissions?: number }>;
  totalTracks?: number;
  role?: UserRole; // only show detailed scores for admin
}


const FinishedView: React.FC<FinishedViewProps> = ({ onRestart, scores, totalTracks = 0, role = 'none' }) => {
  const entries = scores && Object.keys(scores).length > 0 ? Object.entries(scores) : [];

  const makeRanked = (entriesList: [string, any][], key: string, descending = true) => {
    const arr = entriesList.slice().map(([name, s]) => ({ name, stats: s, score: s[key] || 0 }));
    arr.sort((a, b) => (descending ? (b.score - a.score) : (a.score - b.score)) || a.name.localeCompare(b.name));
    let lastScore: number | null = null;
    return arr.map((item, i) => {
      let rank = (lastScore === null || item.score !== lastScore) ? i + 1 : i; // if same score, share previous rank (i is previous index)
      if (lastScore === null) rank = 1;
      const isTie = (lastScore !== null && item.score === lastScore);
      lastScore = item.score;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : String(rank);
      return { ...item, rank, isTie, medal };
    });
  };

  const bestGuessers = makeRanked(entries, 'correctMade', true);
  const leastGuessed = makeRanked(entries, 'correctReceived', false);

  return (
    <div className="h-full w-full bg-[#0f172a] flex flex-col items-center justify-start pt-6 px-4 pb-6 rounded-2xl text-center overflow-auto">
      <div className="text-[6rem]">🏆</div>
      <h2 className="text-4xl font-extrabold text-white mb-2 uppercase">RÉSULTATS FINAUX</h2>
      <p className="text-indigo-300 mb-6">Résumé : {totalTracks} musiques jouées</p>
      {role === 'admin' && scores && entries.length > 0 ? (
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
            {bestGuessers.map((item, i) => {
          const name = item.name;
          const s = item.stats || {};
          const correctMade = s.correctMade || 0;
          const precision = totalTracks > 0 ? Math.round((correctMade / totalTracks) * 100) : 0;
          const rowClass = item.rank === 1 ? 'bg-yellow-500/20' : item.rank === 2 ? 'bg-indigo-400/10' : item.rank === 3 ? 'bg-orange-500/20' : '';
          const medal = item.medal;
          const rankLabel = item.isTie ? `${medal}` : medal;
          return (
            <tr key={name} className={`${rowClass} border-b border-white/5`}>
              <td className="p-2 font-bold text-white w-12">{rankLabel}</td>
              <td className="p-2 text-white font-semibold">{name}</td>
              <td className="p-2 text-white">{correctMade}</td>
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
              <th className="p-2 w-12">#</th>
              <th className="p-2">Joueur</th>
              <th className="p-2">Bonnes réponses reçues</th>
            </tr>
          </thead>
          <tbody>
            {leastGuessed.map((item, i) => {
              const name = item.name;
              const s = item.stats || {};
              const received = s.correctReceived || 0;
              const rowClass = item.rank === 1 ? 'bg-yellow-500/20' : item.rank === 2 ? 'bg-indigo-400/10' : item.rank === 3 ? 'bg-orange-500/20' : '';
              const medal = item.medal;
              const rankLabel = item.isTie ? `${medal}` : medal;
              return (
                <tr key={name} className={`${rowClass} border-b border-white/5`}>
                  <td className="p-2 font-bold text-white w-12">{rankLabel}</td>
                  <td className="p-2 text-white font-semibold">{name}</td>
                  <td className="p-2 text-white">{received}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
                            <button 
                    onClick={onRestart} 
                    className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-3 rounded-full text-xl shadow-[0_4px_0_#166534] active:translate-y-1 active:shadow-none transition-all uppercase italic border-4 border-white"
                  >
                    REJOUER
                  </button>
        </div>
        
      ) : (
        <p className="text-indigo-300">Les résultats sont visibles sur la TV !</p>
      )}
    </div>
  );
};

export default FinishedView;
