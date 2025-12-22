import React, { useState } from 'react';

const sampleVideoIds = [
  'dQw4w9WgXcQ',
  '3JZ_D3ELwOQ',
  'V-_O7nl0Ii0',
  'fJ9rUzIMcZQ',
  'kXYiU_JCYtU',
  '60ItHLz5WEA',
  '09R8_2nJtjg',
  'YQHsXMglC9A',
  'RgKAFK5djSk',
  'eVTXPUF4Oz4'
];

function randFrom<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

const TestSimulateView: React.FC = () => {
  const [count, setCount] = useState<number>(10);
  const [autoStart, setAutoStart] = useState<boolean>(false);
  const [lobby, setLobby] = useState<string>('SIM');

  const generate = () => {
    const players = Array.from({ length: count }, (_, i) => `PLAYER_${String(i + 1).padStart(2, '0')}`);

    const submissions = players.map((name, i) => ({
      id: Math.random().toString(36).slice(2, 9),
      senderName: name,
      youtubeUrl: `https://www.youtube.com/watch?v=${randFrom(sampleVideoIds, i)}`,
      videoId: randFrom(sampleVideoIds, i),
      videoTitle: `Test Track ${i + 1}`,
      startTime: 0,
      timestamp: Date.now() + i
    }));

    const game = {
      status: autoStart ? 'playing' : 'setup',
      currentTrackIndex: 0,
      shuffledPlaylist: autoStart ? submissions.slice() : [],
      lobbyCode: lobby.toUpperCase(),
      participants: players,
      votes: {},
      roundTimer: 30
    } as any;

    localStorage.setItem('qui_ecoute_ca_data', JSON.stringify(submissions));
    localStorage.setItem('qui_ecoute_ca_game', JSON.stringify(game));

    const url = new URL(window.location.href);
    url.searchParams.set('code', lobby.toUpperCase());
    // keep developer flag so the page stays on the test view after reload
    url.searchParams.set('dev_simulate', '1');
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen bg-[#0b1226] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-xl text-white">
        <h2 className="text-2xl font-bold mb-4">Page de test — Simulation de joueurs</h2>
        <div className="grid grid-cols-2 gap-4 items-center mb-4">
          <label className="text-sm opacity-80">Nombre de joueurs</label>
          <input type="number" min={1} max={50} value={count} onChange={e => setCount(Number(e.target.value))} className="bg-slate-700 p-2 rounded" />

          <label className="text-sm opacity-80">Code de plateau</label>
          <input value={lobby} onChange={e => setLobby(e.target.value)} className="bg-slate-700 p-2 rounded" />

          <label className="text-sm opacity-80">Démarrer la partie automatiquement</label>
          <input type="checkbox" checked={autoStart} onChange={e => setAutoStart(e.target.checked)} />
        </div>

        <div className="flex gap-3">
          <button onClick={generate} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded">
            Générer {count} joueurs
          </button>
          <button onClick={() => { localStorage.removeItem('qui_ecoute_ca_data'); localStorage.removeItem('qui_ecoute_ca_game'); window.location.reload(); }} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded">
            Réinitialiser
          </button>
        </div>

        <p className="mt-4 text-sm opacity-80">Après génération, la page va se recharger et l'application utilisera les données simulées. Utilisez <strong>?dev_simulate=1</strong> pour rester sur cette vue.</p>
      </div>
    </div>
  );
};

export default TestSimulateView;
