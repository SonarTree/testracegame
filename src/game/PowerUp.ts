import * as THREE from 'three'
import { Car, Vehicle } from './Car'

export type PowerUpType = 'speed-boost' | 'shield'

export interface PowerUp {
  type: PowerUpType
  mesh: THREE.Mesh
  applyEffect: (car: Car, vehicle: Vehicle) => void
  removeEffect: (car: Car, vehicle: Vehicle) => void
}

export function createPowerUp(
  type: PowerUpType,
  position: THREE.Vector3
): PowerUp {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  let material: THREE.MeshStandardMaterial

  let applyEffect: (car: Car, vehicle: Vehicle) => void
  let removeEffect: (car: Car, vehicle: Vehicle) => void

  switch (type) {
    case 'speed-boost':
      material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.7,
      })
      applyEffect = (car, vehicle) => {
        vehicle.speed += 0.5 // A large, temporary speed increase
      }
      removeEffect = (car, vehicle) => {
        // Effect is instant, so no removal logic needed
      }
      break
    case 'shield':
      material = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.7,
      })
      applyEffect = (car, vehicle) => {
        // Apply shield logic here
      }
      removeEffect = (car, vehicle) => {
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