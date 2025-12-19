
export interface Submission {
  id: string;
  senderName: string;
  youtubeUrl: string;
  videoId: string;
  videoTitle?: string;
  startTime: number;
  timestamp: number;
}

export interface Vote {
  voterName: string;
  guessedName: string;
}

export type UserRole = 'none' | 'admin' | 'player';

export interface GameState {
  status: 'setup' | 'playing' | 'finished';
  currentTrackIndex: number;
  shuffledPlaylist: Submission[];
  lobbyCode: string;
  participants: string[]; 
  votes: Record<number, Vote[]>;
  roundTimer: number; // Durée par défaut d'une manche
}
