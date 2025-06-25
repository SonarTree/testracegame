import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { PowerUpManager } from './PowerUpManager'
import * as PowerUpModule from './PowerUp'
import { Car, Vehicle } from './Car'

vi.mock('./PowerUp', () => ({
  createPowerUp: vi.fn(),
}))

describe('PowerUpManager', () => {
  let scene: THREE.Scene
  let manager: PowerUpManager
  let car: Car
  let vehicle: Vehicle

  beforeEach(() => {
    scene = new THREE.Scene()
    vi.spyOn(scene, 'add')
    vi.spyOn(scene, 'remove')

    const spawnPositions = [new THREE.Vector3(0, 0, 0)]
    manager = new PowerUpManager(scene, spawnPositions)

    car = new THREE.Mesh() as Car
    vehicle = { speed: 0.1, acceleration: 0, steerAngle: 0, wheelBase: 1.5 }
  })

  it('should spawn a power-up on start', () => {
    const mockPowerUp = {
      mesh: new THREE.Mesh(),
      applyEffect: vi.fn(),
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

    manager.start() // Spawns the power-up

    // Move car to the power-up's position
    car.position.set(0, 0, 0)
    manager.update(car, vehicle)

    expect(mockPowerUp.applyEffect).toHaveBeenCalledWith(car, vehicle)
    expect(scene.remove).toHaveBeenCalledWith(mockPowerUp.mesh)
  })
}) 