import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as THREE from 'three'
import { PowerUpManager } from './PowerUpManager'
import * as PowerUpModule from './PowerUp'
import { Entity } from '../ecs/Entity'
import { TransformComponent } from '../ecs/components/TransformComponent'

describe('PowerUpManager', () => {
  let scene: THREE.Scene
  let manager: PowerUpManager
  let playerEntity: Entity
  const mockPowerUp = {
    type: 'speed-boost',
    mesh: new THREE.Mesh(),
    applyEffect: vi.fn(),
    removeEffect: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    
    vi.spyOn(PowerUpModule, 'createPowerUp').mockReturnValue(mockPowerUp as any)

    scene = new THREE.Scene()
    vi.spyOn(scene, 'add')
    vi.spyOn(scene, 'remove')

    const spawnPositions = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(10, 0, 10),
      new THREE.Vector3(20, 0, 20),
      new THREE.Vector3(30, 0, 30),
    ]
    manager = new PowerUpManager(scene, spawnPositions)

    // Create a mock player entity
    playerEntity = new Entity('player')
    playerEntity.addComponent(new TransformComponent(new THREE.Vector3(), new THREE.Quaternion(), new THREE.Euler()))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should spawn power-ups periodically', () => {
    // Ensure we select different spawn points
    vi.spyOn(Math, 'random')
      .mockReturnValue(0) // Will select spawn point 0
      .mockReturnValueOnce(0.25) // Will select spawn point 1
      .mockReturnValueOnce(0.5); // Will select spawn point 2

    manager.start();
    // start() calls spawnPowerUp once immediately
    expect(PowerUpModule.createPowerUp).toHaveBeenCalledTimes(1);

    // Advance time for the first interval
    vi.advanceTimersByTime(10000);
    expect(PowerUpModule.createPowerUp).toHaveBeenCalledTimes(2);
    
    // Advance time for the second interval
    vi.advanceTimersByTime(10000);
    expect(PowerUpModule.createPowerUp).toHaveBeenCalledTimes(3);
  });

  it('should stop spawning power-ups when stop() is called', () => {
    manager.start()
    expect(PowerUpModule.createPowerUp).toHaveBeenCalledOnce()

    manager.stop()
    // Advance time and check that no new power-ups are spawned
    vi.advanceTimersByTime(20000)
    expect(PowerUpModule.createPowerUp).toHaveBeenCalledOnce()
  })

  it('should clear all power-ups from the scene and internal list', () => {
    manager.start()
    manager.clearPowerUps()
    expect(scene.remove).toHaveBeenCalledWith(mockPowerUp.mesh)
    // @ts-expect-error - testing private property
    expect(manager.powerUps.length).toBe(0)
  })

  it('should detect collection and apply effect', () => {
    manager.start() // Spawns the power-up at (0,0,0)

    manager.update(playerEntity)

    expect(mockPowerUp.applyEffect).toHaveBeenCalledWith(playerEntity)
    expect(scene.remove).toHaveBeenCalledWith(mockPowerUp.mesh)
  })

  it('should not update if player has no transform component', () => {
    manager.start()
    const entityWithoutTransform = new Entity('test')
    // We expect update to do nothing and not throw
    expect(() => manager.update(entityWithoutTransform)).not.toThrow()
  })

  it('should rotate existing power-ups during update', () => {
    manager.start()
    const initialRotationY = mockPowerUp.mesh.rotation.y
    // Move player away so it doesn't collect the powerup
    playerEntity.getComponent(TransformComponent)!.position.set(100, 100, 100)
    manager.update(playerEntity)
    expect(mockPowerUp.mesh.rotation.y).toBeCloseTo(initialRotationY + 0.01)
  })

  it('should not spawn more than 3 power-ups', () => {
    manager.start() // 1
    vi.advanceTimersByTime(10000) // 2
    vi.advanceTimersByTime(10000) // 3

    // At the limit, try to spawn more
    vi.advanceTimersByTime(10000) // Should not spawn a 4th

    expect(PowerUpModule.createPowerUp).toHaveBeenCalledTimes(3)
  })

  it('should not spawn if another power-up exists at the chosen position', () => {
    // Mock Math.random to always return the first spawn position
    vi.spyOn(Math, 'random').mockReturnValue(0)
    
    manager.start() // Spawns at position 0
    expect(PowerUpModule.createPowerUp).toHaveBeenCalledTimes(1)

    // Try to spawn again, Math.random is still 0
    vi.advanceTimersByTime(10000)

    // It should not have spawned a new one because the position is taken
    expect(PowerUpModule.createPowerUp).toHaveBeenCalledTimes(1)
    
    // Restore Math.random
    vi.mocked(Math.random).mockRestore()
  })

  it('should not spawn if there are no spawn positions', () => {
    const emptyManager = new PowerUpManager(scene, [])
    emptyManager.start()
    expect(PowerUpModule.createPowerUp).not.toHaveBeenCalled()
  })
}) 