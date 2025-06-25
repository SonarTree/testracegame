import * as THREE from 'three'
import { Car } from './Car'

export class AIController {
  private aiCar: THREE.Mesh
  private playerCar: Car
  private waypoints: THREE.Vector3[]
  private currentWaypointIndex: number
  private speed: number
  private baseSpeed: number

  constructor(
    aiCar: THREE.Mesh,
    playerCar: Car,
    waypoints: THREE.Vector3[],
    speed = 0.08,
  ) {
    this.aiCar = aiCar
    this.playerCar = playerCar
    this.waypoints = waypoints
    this.currentWaypointIndex = 0
    this.baseSpeed = speed
    this.speed = speed
  }

  private adjustSpeedForRubberBanding() {
    const distanceToPlayer = this.aiCar.position.distanceTo(
      this.playerCar.position,
    )
    const rubberBandFactor = THREE.MathUtils.clamp(
      distanceToPlayer / 50,
      0.8,
      1.5,
    )
    this.speed = this.baseSpeed * rubberBandFactor
  }

  private adjustSpeedForTurns() {
    if (this.waypoints.length < 2) return

    const nextWaypoint = this.waypoints[this.currentWaypointIndex]
    const nextNextWaypointIndex =
      (this.currentWaypointIndex + 1) % this.waypoints.length
    const nextNextWaypoint = this.waypoints[nextNextWaypointIndex]

    const directionToNext = nextWaypoint.clone().sub(this.aiCar.position).normalize()
    const directionToNextNext = nextNextWaypoint.clone().sub(nextWaypoint).normalize()

    const dot = directionToNext.dot(directionToNextNext)
    const turnFactor = THREE.MathUtils.mapLinear(dot, -1, 1, 0.7, 1.0)
    this.speed *= turnFactor
  }

  public update() {
    if (this.waypoints.length === 0) return

    this.adjustSpeedForRubberBanding()
    this.adjustSpeedForTurns()

    const nextWaypoint = this.waypoints[this.currentWaypointIndex]
    const distanceToWaypoint = this.aiCar.position.distanceTo(nextWaypoint)

    if (distanceToWaypoint < 1.5) {
      this.currentWaypointIndex =
        (this.currentWaypointIndex + 1) % this.waypoints.length
    }

    const direction = nextWaypoint.clone().sub(this.aiCar.position).normalize()
    // Add a slight steering interpolation for smoother turning
    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        direction
    );
    this.aiCar.quaternion.slerp(targetQuaternion, 0.1);

    this.aiCar.position.add(direction.multiplyScalar(this.speed))
  }
} 