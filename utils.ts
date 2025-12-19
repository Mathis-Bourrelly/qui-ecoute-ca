
export const extractVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

export const extractTimecode = (url: string): number => {
  try {
    const urlObj = new URL(url.includes('://') ? url : `https://${url}`);
    const t = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
    if (!t) return 0;

    // Si c'est juste un nombre (ex: t=80)
    if (/^\d+$/.test(t)) return parseInt(t, 10);

    // Si c'est au format 1m20s
    let totalSeconds = 0;
    const minutes = t.match(/(\d+)m/);
    const seconds = t.match(/(\d+)s/);
    if (minutes) totalSeconds += parseInt(minutes[1], 10) * 60;
    if (seconds) totalSeconds += parseInt(seconds[1], 10);
    return totalSeconds;
  } catch {
    return 0;
  }
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateLobbyCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export type WSMessage = { type: string; payload?: any };

export const createWebSocketClient = (opts?: {
  url?: string;
  onOpen?: () => void;
  onClose?: (ev?: CloseEvent) => void;
  onMessage?: (msg: WSMessage) => void;
  onError?: (err: Event) => void;
}) => {
  const defaultUrl = (() => {
    try {
      if (typeof location !== 'undefined') {
        const proto = location.protocol === 'https:' ? 'wss' : 'ws';
        return `${proto}://${location.host}/ws/`;
      }
    } catch (e) {
      // fallback
    }
    return 'ws://localhost:3001';
  })();

  const url = opts?.url || defaultUrl;
  let ws: WebSocket | null = null;
  let reconnectDelay = 1000;
  let shouldReconnect = true;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectDelay = 1000;
      opts?.onOpen && opts.onOpen();
    };

    ws.onmessage = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        opts?.onMessage && opts.onMessage(data as WSMessage);
      } catch (err) {
        // ignore parse errors
      }
    };

    ws.onclose = (ev) => {
      opts?.onClose && opts.onClose(ev);
      if (shouldReconnect) {
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(10000, reconnectDelay + 1000);
      }
    };

    ws.onerror = (err) => {
      opts?.onError && opts.onError(err);
    };
  };

  connect();

  return {
    send: (msg: WSMessage | string) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
        return true;
      }
      return false;
    },
    close: () => {
      shouldReconnect = false;
      ws?.close();
    },
  };
};
