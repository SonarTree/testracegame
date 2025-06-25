export const GameState = {
  MAIN_MENU: 'MAIN_MENU',
  MAP_SELECTION: 'MAP_SELECTION',
  PLAYING: 'PLAYING',
  RACE_OVER: 'RACE_OVER',
} as const;

export type GameState = typeof GameState[keyof typeof GameState]; 