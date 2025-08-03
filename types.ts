
export enum GameState {
  LOBBY,
  PLAYING,
  RESULTS,
  LEADERBOARD,
}

export enum GameMode {
  TIME = 'time',
  WORDS = 'words',
  ZEN = 'zen',
}

export type GameConfig = {
  mode: GameMode;
  value: number; // Time in seconds for TIME mode, word count for WORDS mode, 0 for ZEN
};

export interface SessionStats {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  charStats: {
    correct: number;
    incorrect: number;
    total: number;
  };
  consistency: number; // Lower is better
  timeElapsed: number; // in seconds
}

export interface LeaderboardEntry {
  id: string; // score id
  wpm: number;
  accuracy: number;
  category: string;
  created_at: string;
  name: string;
}
