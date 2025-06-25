import * as THREE from 'three'
import { Entity } from '../ecs/Entity'
import { PhysicsComponent } from '../ecs/components/PhysicsComponent'

export type PowerUpType = 'speed-boost' | 'shield'

export interface PowerUp {
  type: PowerUpType
  mesh: THREE.Mesh
  applyEffect: (entity: Entity) => void
  removeEffect: (entity: Entity) => void
}

export function createPowerUp(
  type: PowerUpType,
  position: THREE.Vector3
): PowerUp {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  let material: THREE.MeshStandardMaterial

  let applyEffect: (entity: Entity) => void
  let removeEffect: (entity: Entity) => void

  switch (type) {
    case 'speed-boost':
      material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.7,
      })
      applyEffect = (entity) => {
        const physics = entity.getComponent(PhysicsComponent)
        if (physics) {
          physics.speed += 0.5 // A large, temporary speed increase
        }
      }
      removeEffect = (entity) => {
        // Effect is instant, so no removal logic needed
      }
      break
    case 'shield':
      material = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.7,
      })
      applyEffect = (entity) => {
        // Apply shield logic here
      }
      removeEffect = (entity) => {
        // Remove shield logic here
      }
      break
    default:
      throw new Error(`Unknown power-up type: ${type}`)
  }

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)
  mesh.castShadow = true

  return { type, mesh, applyEffect, removeEffect }
} 