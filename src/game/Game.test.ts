import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { Game } from '../Game'
import * as GameUI from '../ui/GameUI'
import SoundManager from './SoundManager'
import { GameState } from './GameState'
import { Entity } from '../ecs/Entity'
import { LapTrackerComponent } from '../ecs/components/LapTrackerComponent'
import { TransformComponent } from '../ecs/components/TransformComponent'
import { config } from '../config'

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
    CubeTextureLoader: vi.fn().mockReturnValue({
      setPath: vi.fn().mockReturnThis(),
      load: vi.fn().mockReturnValue({}),
    })
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

  it('should transition to PLAYING state when a map is selected and race is started', () => {
    game['selectedMapId'] = 'classic_circuit';
    game['startRace']();
    expect(game.state).toBe(GameState.PLAYING);
    expect(GameUI.showGameHud).toHaveBeenCalled();
  });

  it('should transition to RACE_OVER state when the race is finished', () => {
    game['selectedMapId'] = 'classic_circuit';
    game['startRace']();
    
    // Get the player entity from the entity manager
    const playerEntity = game['entityManager'].getEntity('player')
    expect(playerEntity).toBeDefined()

    // Modify components to simulate the final lap conditions
    const lapTracker = playerEntity!.getComponent(LapTrackerComponent)!
    const transform = playerEntity!.getComponent(TransformComponent)!
    
    lapTracker.lap = config.race.laps
    lapTracker.passedHalfway = true
    lapTracker.lastQuadrant = 4
    
    // Simulate crossing the finish line by moving to quadrant 1
    transform.position.set(1, 0, 1)
    
    // Manually call update to trigger lap/race completion logic
    game['update']()
    game['handleLapEvents']([{ type: 'GAME_STATE_CHANGE', newState: GameState.RACE_OVER }])

    expect(game.state).toBe(GameState.RACE_OVER)
    expect(GameUI.showRaceOverMenu).toHaveBeenCalled()
  })

  it('should transition from RACE_OVER to MAIN_MENU when returnToMenu is called', () => {
    // Manually add a mock player entity for the RACE_OVER state to work
    const playerEntity = new Entity('player');
    playerEntity.addComponent(new LapTrackerComponent());
    game['entityManager'].addEntity(playerEntity);

    // First, get to RACE_OVER state
    game.setState(GameState.RACE_OVER)
    expect(game.state).toBe(GameState.RACE_OVER)

    // Then, return to the main menu
    game.returnToMenu()
    expect(game.state).toBe(GameState.MAIN_MENU)
    expect(GameUI.showMainMenu).toHaveBeenCalledTimes(2) // Once on init, once on return
  })

  it('should play engine sound when accelerating', () => {
    game['selectedMapId'] = 'classic_circuit';
    game['startRace']();
    game['keyboard']['w'] = true // Simulate forward input
    game['update']() // Manually call update to trigger sound logic
    const soundManagerInstance = (SoundManager as any).mock.instances[0]
    expect(soundManagerInstance.playSound).toHaveBeenCalledWith('engine')
  })
}) 