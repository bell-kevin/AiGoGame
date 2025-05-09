export type StoneColor = 'black' | 'white' | null;
export type Coordinate = [number, number];
export type BoardSize = 9 | 13 | 19;
export type Difficulty = 'very-easy' | 'easy' | 'medium' | 'hard' | 'very-hard';
export type Theme = 'light' | 'dark';

export interface Stone {
  color: StoneColor;
  coordinate: Coordinate;
}

export interface GameState {
  board: StoneColor[][];
  currentTurn: StoneColor;
  blackCaptures: number;
  whiteCaptures: number;
  previousBoard: StoneColor[][] | null;
  previousTwoBoard: StoneColor[][] | null;
  moveHistory: Move[];
  gameOver: boolean;
  winner: StoneColor;
  lastMove: Coordinate | null;
  boardSize: BoardSize;
  difficulty: Difficulty;
  showTerritory: boolean;
  territoryMap: StoneColor[][] | null;
  isAiThinking: boolean;
  showTutorial: boolean;
  tutorialStep: number;
  theme: Theme;
  aiTimeoutId: number | null;
}

export interface Move {
  color: StoneColor;
  coordinate: Coordinate | null; // null means "pass"
  captures: number;
}