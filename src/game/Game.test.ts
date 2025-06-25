import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { Game } from '../Game'
import * as GameUI from '../ui/GameUI'
import SoundManager from './SoundManager'
import { GameState } from './GameState'

// Mock the UI and SoundManager modules
vi.mock('../ui/GameUI')
vi.mock('./SoundManager')
vi.mock('three', async (importOriginal) => {
  const originalThree = await importOriginal<typeof THREE>()
  return {
    ...originalThree,
    WebGLRenderer: vi.fn().mockReturnValue({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
      shadowMap: {
        enabled: false,
      },
    }),
  }
})

describe('Game', () => {
  let game: Game

  beforeEach(async () => {
    vi.clearAllMocks()
    // Since create() is async, we need to handle the promise
    game = await Game.create()
  })

  it('should start in the MAIN_MENU state', () => {
    expect(game.state).toBe(GameState.MAIN_MENU)
    expect(GameUI.showMainMenu).toHaveBeenCalled()
  })

  it('should transition to PLAYING state when startGame is called', () => {
    game.startGame()
    expect(game.state).toBe(GameState.PLAYING)
    expect(GameUI.showGameHud).toHaveBeenCalled()
  })

  it('should play engine sound when accelerating', () => {
    game.startGame()
    game['keyboard']['w'] = true // Simulate forward input
    game['update']() // Manually call update to trigger sound logic
    const soundManagerInstance = (SoundManager as any).mock.instances[0]
    expect(soundManagerInstance.playSound).toHaveBeenCalledWith('engine')
  })
}) 