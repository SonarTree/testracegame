import { System } from '../System';
import { Entity } from '../Entity';
import { TransformComponent } from '../components/TransformComponent';
import { AIControlComponent } from '../components/AIControlComponent';
import { PlayerInputComponent } from '../components/PlayerInputComponent';
import * as THREE from 'three';

export class AISystem extends System {
  private getPlayerEntity(entities: Entity[]): Entity | undefined {
    return entities.find(e => e.hasComponent(PlayerInputComponent));
  }

  update(entities: Entity[], deltaTime: number): void {
    const playerEntity = this.getPlayerEntity(entities);
    if (!playerEntity || !playerEntity.hasComponent(TransformComponent)) return;

    const playerTransform = playerEntity.getComponent(TransformComponent)!;

    for (const entity of entities) {
      if (entity.hasComponent(TransformComponent) && entity.hasComponent(AIControlComponent)) {
        const transform = entity.getComponent(TransformComponent)!;
        const aiControl = entity.getComponent(AIControlComponent)!;

        if (aiControl.waypoints.length === 0) continue;

        // --- Start of migrated AIController logic ---

        // 1. Adjust speed for rubber-banding
        const distanceToPlayer = transform.position.distanceTo(playerTransform.position);
        const rubberBandFactor = THREE.MathUtils.clamp(distanceToPlayer / 50, 0.8, 1.5);
        let currentSpeed = aiControl.speed * rubberBandFactor;

        // 2. Adjust speed for turns
        if (aiControl.waypoints.length > 1) {
            const nextWaypoint = aiControl.waypoints[aiControl.currentWaypointIndex];
            const nextNextWaypointIndex = (aiControl.currentWaypointIndex + 1) % aiControl.waypoints.length;
            const nextNextWaypoint = aiControl.waypoints[nextNextWaypointIndex];

            const directionToNext = nextWaypoint.clone().sub(transform.position).normalize();
            const directionToNextNext = nextNextWaypoint.clone().sub(nextWaypoint).normalize();

            const dot = directionToNext.dot(directionToNextNext);
            const turnFactor = THREE.MathUtils.mapLinear(dot, -1, 1, 0.7, 1.0);
            currentSpeed *= turnFactor;
        }

        // 3. Waypoint progression
        const nextWaypoint = aiControl.waypoints[aiControl.currentWaypointIndex];
        const distanceToWaypoint = transform.position.distanceTo(nextWaypoint);
        if (distanceToWaypoint < 1.5) {
          aiControl.currentWaypointIndex = (aiControl.currentWaypointIndex + 1) % aiControl.waypoints.length;
        }

        // 4. Update rotation (steering)
        const direction = nextWaypoint.clone().sub(transform.position).normalize();
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            direction
        );
        transform.quaternion.slerp(targetQuaternion, 0.1);
        transform.rotation.setFromQuaternion(transform.quaternion, 'XYZ');

        // 5. Update position (movement)
        // We use a clone of the direction vector so we don't modify the original
        transform.position.add(direction.clone().multiplyScalar(currentSpeed));
        
        // --- End of migrated AIController logic ---
      }
    }
  }
} 