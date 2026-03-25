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
  wordColorMode: 'auto' | 'neutral' | 'fixed';
  wordFixedColor: string;
  bgColorMode: 'auto' | 'fixed' | 'theme';
  bgFixedColor: string;
  bgTheme: 'warm' | 'cool' | 'nature' | 'dark';
}

export interface WordDetail {
  definition: string;
  etymology: string;
  collocations: string[];
  examples: { en: string; zh: string }[];
}
