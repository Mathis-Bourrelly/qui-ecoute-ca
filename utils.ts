
export const extractVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

export const extractTimecode = (url: string): number => {
  const urlObj = new URL(url.includes('://') ? url : `https://${url}`);
  const t = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
  
  if (!t) return 0;
  
  // Gère les formats comme 1m20s ou juste 80
  const match = t.match(/(?:(\d+)m)?(?:(\d+)s)?(\d+)?/);
  if (!match) return 0;
  
  const m = parseInt(match[1] || '0');
  const s = parseInt(match[2] || '0');
  const pureS = parseInt(match[3] || '0');
  
  return (m * 60) + s + (match[3] ? pureS : 0);
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
