import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { PowerUpManager } from './PowerUpManager'
import * as PowerUpModule from './PowerUp'
import { Entity } from '../ecs/Entity'
import { TransformComponent } from '../ecs/components/TransformComponent'

vi.mock('./PowerUp', () => ({
  createPowerUp: vi.fn(),
}))

describe('PowerUpManager', () => {
  let scene: THREE.Scene
  let manager: PowerUpManager
  let playerEntity: Entity

  beforeEach(() => {
    vi.clearAllMocks()
    scene = new THREE.Scene()
    vi.spyOn(scene, 'add')
    vi.spyOn(scene, 'remove')

    const spawnPositions = [new THREE.Vector3(0, 0, 0)]
    manager = new PowerUpManager(scene, spawnPositions)

    // Create a mock player entity
    playerEntity = new Entity('player')
    playerEntity.addComponent(new TransformComponent(new THREE.Vector3(), new THREE.Quaternion(), new THREE.Euler()))
  })

  it('should spawn a power-up on start', () => {
    const mockPowerUp = {
      mesh: new THREE.Mesh(),
      applyEffect: vi.fn(),
      removeEffect: vi.fn(),
    }
    ;(PowerUpModule.createPowerUp as any).mockReturnValue(mockPowerUp)

    manager.start()

    expect(PowerUpModule.createPowerUp).toHaveBeenCalledOnce()
    expect(scene.add).toHaveBeenCalledWith(mockPowerUp.mesh)
  })

  it('should detect collection and apply effect', () => {
    const mockPowerUp = {
      type: 'speed-boost',
      mesh: new THREE.Mesh(),
      applyEffect: vi.fn(),
      removeEffect: vi.fn(),
    }
    ;(PowerUpModule.createPowerUp as any).mockReturnValue(mockPowerUp)

    manager.start() // Spawns the power-up at (0,0,0)

    // The player entity starts at (0,0,0) so it's on top of the power-up
    manager.update(playerEntity)

    expect(mockPowerUp.applyEffect).toHaveBeenCalledWith(playerEntity)
    expect(scene.remove).toHaveBeenCalledWith(mockPowerUp.mesh)
  })
}) 