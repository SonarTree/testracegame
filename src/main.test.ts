import { describe, it, vi, expect } from 'vitest';
import { Game } from './Game';

vi.mock('./Game', () => {
  return {
    Game: {
      create: vi.fn(),
    },
  };
});

describe('main', () => {
  it('should create the game', async () => {
    await import('./main');
    expect(Game.create).toHaveBeenCalled();
  });
}); 