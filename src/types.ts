export interface Question {
  id: string;
  level: number;
  levelName: string;
  type: "multiple_choice" | "fill_in_the_blank" | "essay";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
}

export interface Chapter {
  id: string;
  title: string;
  areaName: string;
  monsterName: string;
  monsterDescription: string;
  isBoss: boolean;
  questions: Question[];
}

export interface Campaign {
  campaignTitle: string;
  chapters: Chapter[];
}

export interface HistoryItem {
  question: string;
  levelName: string;
  type: string;
  isCorrect: boolean;
  chapterTitle: string;
}

export interface PlayerItems {
  revive: number;
  hint: number;
  shield: number;
  doubleXp: boolean;
}

export interface PlayerState {
  username?: string;
  phoneOrEmail?: string;
  avatar?: string;
  isLoggedIn?: boolean;
  xp: number;
  level: number;
  gold: number;
  hearts: number;
  items: PlayerItems;
  history: HistoryItem[];
  activeCampaign?: Campaign;
  unlockedChapters: string[]; // ids of unlocked chapters
  completedChapters: string[]; // ids of completed chapters
  collectedPieces: Record<string, number[]>; // puzzleThemeId -> array of piece indexes (0..11)
  completedPuzzles: string[]; // puzzleThemeId list
  activeTab: "home" | "map" | "battle" | "shop" | "puzzles" | "tutor" | "stats";
  activeChapterId?: string;
}
