import * as THREE from 'three'

export class AIController {
  private aiCar: THREE.Mesh
  private waypoints: THREE.Vector3[]
  private currentWaypointIndex: number
  private speed: number

  constructor(
    aiCar: THREE.Mesh,
    waypoints: THREE.Vector3[],
    speed = 0.08
  ) {
    this.aiCar = aiCar
    this.waypoints = waypoints
    this.currentWaypointIndex = 0
    this.speed = speed
  }

  public update() {
    if (this.waypoints.length === 0) return

    const nextWaypoint = this.waypoints[this.currentWaypointIndex]
    const distanceToWaypoint = this.aiCar.position.distanceTo(nextWaypoint)

    if (distanceToWaypoint < 1) {
      this.currentWaypointIndex =
        (this.currentWaypointIndex + 1) % this.waypoints.length
    } else {
      const direction = nextWaypoint.clone().sub(this.aiCar.position).normalize()
      this.aiCar.position.add(direction.multiplyScalar(this.speed))
      this.aiCar.lookAt(nextWaypoint)
    }
  }
} 