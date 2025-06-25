import { System } from '../System';
import { Entity } from '../Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { config } from '../../config';
import * as THREE from 'three';

export class PhysicsSystem extends System {
  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      if (entity.hasComponent(TransformComponent) && entity.hasComponent(PhysicsComponent)) {
        const transform = entity.getComponent(TransformComponent)!;
        const physics = entity.getComponent(PhysicsComponent)!;

        // The original `updateCarPhysics` logic is adapted here.
        // We assume InputSystem will update `physics.acceleration` as raw input (-1 to 1)
        // and `physics.steerAngle` as raw input (-1 to 1).

        // 1. Update Speed (Acceleration, Braking, Friction)
        const currentAcceleration = physics.acceleration * config.vehicle.enginePower;
        physics.speed += currentAcceleration;

        // Apply braking force if trying to reverse while moving forward
        if (physics.acceleration < 0 && physics.speed > 0) {
            physics.speed -= config.vehicle.brakingForce;
        }

        // 2. Apply Friction
        if (physics.isDrifting) {
            physics.speed *= config.vehicle.driftFriction;
        } else {
            physics.speed *= config.vehicle.friction;
        }

        physics.speed = Math.max(-0.4, Math.min(0.4, physics.speed));
        
        // 3. Update Rotation
        // We use the raw steerAngle input here, same as the original logic.
        transform.rotation.y += physics.steerAngle * config.vehicle.turnSpeed * (physics.speed / 1.0);
        transform.quaternion.setFromEuler(transform.rotation);

        // 4. Move the entity based on its new rotation and speed
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(transform.quaternion);
        const movement = forward.multiplyScalar(physics.speed);
        transform.position.add(movement);
      }
    }
  }
} 