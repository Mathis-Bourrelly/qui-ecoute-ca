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

  const [status, setStatus] = useState<string | null>(null);

  const generate = async () => {
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

    // Persist locally first so the app in the same tab reads it immediately
    localStorage.setItem('qui_ecoute_ca_data', JSON.stringify(submissions));
    localStorage.setItem('qui_ecoute_ca_game', JSON.stringify(game));

    // Try to notify the running WebSocket server so other tabs (host) get updates
    setStatus('Connexion au serveur WS...');
    try {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${proto}://${window.location.host.replace(/:\d+$/, '')}:${window.location.port || '3001'}/ws/`;
      // Fallback to host origin path if that fails
      let ws: WebSocket | null = null;

      try {
        ws = new WebSocket(`${proto}://${window.location.host}/ws/`);
      } catch (e) {
        try {
          ws = new WebSocket(wsUrl);
        } catch (e2) {
          ws = null;
        }
      }

      if (ws) {
        const ready = await new Promise<boolean>((resolve) => {
          const t = setTimeout(() => resolve(false), 2500);
          ws!.onopen = () => { clearTimeout(t); resolve(true); };
          ws!.onclose = () => { clearTimeout(t); resolve(false); };
          ws!.onerror = () => { clearTimeout(t); resolve(false); };
        });

        if (ready) {
          setStatus('Envoi des événements de simulation...');

          // Send participant joined for each player
          players.forEach(name => {
            ws!.send(JSON.stringify({ type: 'participant:joined', payload: { name, lobbyCode: lobby.toUpperCase() } }));
          });

          // Send bulk submissions
          ws!.send(JSON.stringify({ type: 'submission:bulk', payload: { lobbyCode: lobby.toUpperCase(), submissions } }));

          // If autoStart, send game:start
          if (autoStart) {
            ws!.send(JSON.stringify({ type: 'game:start', payload: game }));
          } else {
            // also send a game:update so host registers participants list
            ws!.send(JSON.stringify({ type: 'game:update', payload: game }));
          }

          setTimeout(() => { try { ws!.close(); } catch {} }, 300);
        } else {
          setStatus('Connexion WS impossible, utilisation locale only.');
        }
      } else {
        setStatus('Impossible d\'ouvrir WS – utilisation locale only.');
      }
    } catch (e) {
      console.warn('WS error', e);
      setStatus('Erreur lors de l\'envoi WS — utilisation locale only.');
    }

      // keep developer flag so the page stays on the test view if opened again
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('code', lobby.toUpperCase());
        url.searchParams.set('dev_simulate', '1');
        window.history.replaceState({}, document.title, url.toString());
      } catch {}

      setStatus('Génération terminée — notifications envoyées si WS disponible.');
  };

  // Add one music per known participant (reads current game/submissions from localStorage)
  const addOneTrackPerPlayer = async () => {
    setStatus('Ajout d\'une musique par joueur...');

    try {
      const storedGame = JSON.parse(localStorage.getItem('qui_ecoute_ca_game') || 'null');
      const storedSubs = JSON.parse(localStorage.getItem('qui_ecoute_ca_data') || '[]');
      const participants: string[] = (storedGame && Array.isArray(storedGame.participants) && storedGame.participants.length) ? storedGame.participants : Array.from(new Set((storedSubs || []).map((s: any) => s.senderName)));

      if (!participants || participants.length === 0) {
        setStatus('Aucun participant trouvé dans le jeu local.');
        return;
      }

      const base = storedSubs || [];
      const newSubs: any[] = participants.map((name: string, i: number) => {
        const videoId = sampleVideoIds[(base.length + i) % sampleVideoIds.length];
        return {
          id: Math.random().toString(36).slice(2, 9),
          senderName: name,
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          videoId,
          videoTitle: `Auto ${name} #${base.length + i + 1}`,
          startTime: 0,
          timestamp: Date.now() + i
        };
      });

      const merged = [...base, ...newSubs];
      localStorage.setItem('qui_ecoute_ca_data', JSON.stringify(merged));

      // Notify server per submission if possible
      try {
        let ws: WebSocket | null = null;
        try { ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/`); } catch (e) { ws = null; }
        if (ws) {
          const ready = await new Promise<boolean>((resolve) => {
            const t = setTimeout(() => resolve(false), 2000);
            ws!.onopen = () => { clearTimeout(t); resolve(true); };
            ws!.onerror = () => { clearTimeout(t); resolve(false); };
            ws!.onclose = () => { clearTimeout(t); resolve(false); };
          });

          if (ready) {
            for (const s of newSubs) {
              ws!.send(JSON.stringify({ type: 'submission:new', payload: { lobbyCode: lobby.toUpperCase(), submission: s } }));
            }
            setTimeout(() => { try { ws!.close(); } catch {} }, 250);
            setStatus(`Ajouté ${newSubs.length} musiques (notif. serveur envoyée).`);
            return;
          }
        }
      } catch (e) {
        console.warn('WS notify failed', e);
      }

      setStatus(`Ajouté ${newSubs.length} musiques (mode local).`);
    } catch (e) {
      console.error(e);
      setStatus('Erreur lors de l\'ajout des musiques.');
    }
  };

  // Faire voter tous les joueurs aléatoirement pour la piste courante
  const randomVoteAll = async () => {
    setStatus('Envoi des votes aléatoires...');

    try {
      const storedGame = JSON.parse(localStorage.getItem('qui_ecoute_ca_game') || 'null');
      const storedSubs = JSON.parse(localStorage.getItem('qui_ecoute_ca_data') || '[]');
      const participants: string[] = (storedGame && Array.isArray(storedGame.participants) && storedGame.participants.length) ? storedGame.participants : Array.from(new Set((storedSubs || []).map((s: any) => s.senderName)));

      if (!participants || participants.length === 0) {
        setStatus('Aucun participant trouvé pour voter.');
        return;
      }

      const trackIndex = (storedGame && typeof storedGame.currentTrackIndex === 'number') ? storedGame.currentTrackIndex : 0;

      // Build votes: each participant votes randomly among participant names
      const votes = participants.map(voter => {
        const guessed = participants[Math.floor(Math.random() * participants.length)];
        return { voterName: voter, guessedName: guessed };
      });

      // Update local game object votes (merge)
      try {
        const g = storedGame || { lobbyCode: lobby.toUpperCase(), votes: {} };
        if (!g.votes) g.votes = {};
        g.votes[trackIndex] = Array.from(new Set([...(g.votes[trackIndex] || []), ...votes].map(JSON.stringify))).map(JSON.parse);
        localStorage.setItem('qui_ecoute_ca_game', JSON.stringify(g));
      } catch (e) {
        console.warn('failed to merge local votes', e);
      }

      // Try to notify server for each vote
      try {
        let ws: WebSocket | null = null;
        try { ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/`); } catch (e) { ws = null; }
        if (ws) {
          const ready = await new Promise<boolean>((resolve) => {
            const t = setTimeout(() => resolve(false), 2000);
            ws!.onopen = () => { clearTimeout(t); resolve(true); };
            ws!.onerror = () => { clearTimeout(t); resolve(false); };
            ws!.onclose = () => { clearTimeout(t); resolve(false); };
          });

          if (ready) {
            for (const v of votes) {
              ws!.send(JSON.stringify({ type: 'vote:new', payload: { lobbyCode: lobby.toUpperCase(), trackIndex, vote: v } }));
            }
            setTimeout(() => { try { ws!.close(); } catch {} }, 250);
            setStatus(`Votes envoyés (${votes.length}) et stockés localement.`);
            return;
          }
        }
      } catch (e) {
        console.warn('WS notify failed', e);
      }

      setStatus(`Votes stockés localement (${votes.length}).`);
    } catch (e) {
      console.error(e);
      setStatus('Erreur lors de l\'envoi des votes.');
    }
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
          <button onClick={addOneTrackPerPlayer} className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded">
            Ajouter 1 musique par joueur
          </button>
        </div>

        {status && <p className="mt-4 text-sm opacity-90">{status}</p>}

        <p className="mt-4 text-sm opacity-80">Après génération, la page va se recharger et l'application utilisera les données simulées. Utilisez <strong>?dev_simulate=1</strong> pour rester sur cette vue.</p>
      </div>
    </div>
  );
};

export default TestSimulateView;
