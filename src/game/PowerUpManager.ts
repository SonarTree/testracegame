import * as THREE from 'three'
import { PowerUp, createPowerUp, PowerUpType } from './PowerUp'
import { Car, Vehicle } from './Car'

export class PowerUpManager {
  private scene: THREE.Scene
  private powerUps: PowerUp[] = []
  private spawnPositions: THREE.Vector3[]

  constructor(scene: THREE.Scene, spawnPositions: THREE.Vector3[]) {
    this.scene = scene
    this.spawnPositions = spawnPositions
  }

  public start() {
    this.spawnPowerUp()
    // Spawn a new power-up every 10 seconds
    setInterval(() => this.spawnPowerUp(), 10000)
  }

  public update(car: Car, vehicle: Vehicle) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i]
      powerUp.mesh.rotation.y += 0.01 // Make them slowly rotate

      const distance = car.position.distanceTo(powerUp.mesh.position)
      if (distance < 2) {
        // Player collected the power-up
        powerUp.applyEffect(car, vehicle)
        this.scene.remove(powerUp.mesh)
        this.powerUps.splice(i, 1)
        break // Assume only one power-up can be collected at a time
      }
    }
  }

  private spawnPowerUp() {
    if (this.spawnPositions.length === 0) return

    // Don't spawn if there are already a certain number of power-ups
    if (this.powerUps.length >= 3) return

    const spawnIndex = Math.floor(Math.random() * this.spawnPositions.length)
    const position = this.spawnPositions[spawnIndex]

    // Avoid spawning in the same position as an existing power-up
    if (this.powerUps.some((p) => p.mesh.position.equals(position))) {
      return
    }

    const type: PowerUpType = 'speed-boost' // For now, only spawn speed boosts
    const powerUp = createPowerUp(type, position)

    this.powerUps.push(powerUp)
    this.scene.add(powerUp.mesh)
  }
} 