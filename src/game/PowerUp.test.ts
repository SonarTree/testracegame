import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createPowerUp } from './PowerUp'
import { Vehicle } from './Car'

describe('PowerUp Module', () => {
  it('should create a speed-boost power-up with the correct properties', () => {
    const position = new THREE.Vector3(1, 2, 3)
    const powerUp = createPowerUp('speed-boost', position)

    expect(powerUp.type).toBe('speed-boost')
    expect(powerUp.mesh).toBeInstanceOf(THREE.Mesh)
    expect(powerUp.mesh.position).toEqual(position)
  })

  it('should apply a speed-boost effect correctly', () => {
    const position = new THREE.Vector3(0, 0, 0)
    const powerUp = createPowerUp('speed-boost', position)
    const vehicle: Vehicle = { speed: 0.1, acceleration: 0, steerAngle: 0, wheelBase: 1.5 }

    powerUp.applyEffect({} as any, vehicle)

    expect(vehicle.speed).toBeCloseTo(0.6)
  })

  it('should create a shield power-up', () => {
    const position = new THREE.Vector3(4, 5, 6)
    const powerUp = createPowerUp('shield', position)

    expect(powerUp.type).toBe('shield')
    expect(powerUp.mesh).toBeInstanceOf(THREE.Mesh)
    expect(powerUp.mesh.position).toEqual(position)
  })
}) 