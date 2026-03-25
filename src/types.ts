export interface Word {
  word: string;
  pos: string;
  meaning: string;
}

export interface WordBank {
  id: string;
  name: string;
  words: Word[];
  isCustom?: boolean;
}

export interface AppSettings {
  currentBankId: string;
  noRepeat: boolean;
  displayDuration: number; // in seconds
  volume: number; // 0 to 1
  brightness: number; // 20 to 100
  wordColorMode: 'dopamine' | 'neutral' | 'fixed' | 'custom';
  wordFixedColor: string;
  wordCustomColors: string[]; // max 3
  bgColorMode: 'dopamine' | 'fixed' | 'theme' | 'custom';
  bgFixedColor: string;
  bgTheme: 'warm' | 'cool' | 'nature' | 'dark';
  bgCustomColors: string[]; // max 5
  dailyGoal: number | 'mood'; // number or 'mood' for "as I feel"
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  wordCount: number;
  timeSpent: number; // in seconds
  mood?: string; // emoji or label
  moodColor?: string;
  note?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinDate: string;
  level: number;
  exp: number;
}

export interface WordDetail {
  definition: string;
  etymology: string;
  collocations: string[];
  examples: { en: string; zh: string }[];
}
