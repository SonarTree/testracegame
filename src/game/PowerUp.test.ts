import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'
import { createPowerUp } from './PowerUp'
import { Entity } from '../ecs/Entity'
import { PhysicsComponent } from '../ecs/components/PhysicsComponent'

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
    
    // Create a mock entity with a PhysicsComponent
    const physicsComponent = new PhysicsComponent(0.1, 0, 0, 1.5)
    const mockEntity = new Entity('test')
    mockEntity.addComponent(physicsComponent)

    powerUp.applyEffect(mockEntity)

    // The speed should be increased by 0.5
    expect(physicsComponent.speed).toBeCloseTo(0.6)
  })

  it('should create a shield power-up', () => {
    const position = new THREE.Vector3(4, 5, 6)
    const powerUp = createPowerUp('shield', position)

    expect(powerUp.type).toBe('shield')
    expect(powerUp.mesh).toBeInstanceOf(THREE.Mesh)
    expect(powerUp.mesh.position).toEqual(position)
  })

  it('should not throw when applying speed-boost to an entity without a physics component', () => {
    const powerUp = createPowerUp('speed-boost', new THREE.Vector3())
    const entity = new Entity('no-physics')
    expect(() => powerUp.applyEffect(entity)).not.toThrow()
  })

  it('should cover shield power-up effect and removal', () => {
    const powerUp = createPowerUp('shield', new THREE.Vector3())
    const entity = new Entity('test-shield')
    expect(() => powerUp.applyEffect(entity)).not.toThrow()
    expect(() => powerUp.removeEffect(entity)).not.toThrow()
  })

  it('should throw an error for an unknown power-up type', () => {
    const position = new THREE.Vector3(0, 0, 0)
    // @ts-expect-error - Testing invalid power-up type
    expect(() => createPowerUp('unknown', position)).toThrow(
      'Unknown power-up type: unknown'
    )
  })
}) 