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
}

export interface WordDetail {
  definition: string;
  etymology: string;
  collocations: string[];
  examples: { en: string; zh: string }[];
}
