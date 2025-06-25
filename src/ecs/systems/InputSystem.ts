import { System } from '../System';
import { Entity } from '../Entity';
import { PlayerInputComponent } from '../components/PlayerInputComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';

export class InputSystem extends System {
  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      if (entity.hasComponent(PlayerInputComponent) && entity.hasComponent(PhysicsComponent)) {
        const input = entity.getComponent(PlayerInputComponent)!;
        const physics = entity.getComponent(PhysicsComponent)!;

        // Get raw input from the keyboard state
        const forwardInput = (input.keyboard['w'] ? 1 : 0) - (input.keyboard['s'] ? 1 : 0);
        const turnInput = (input.keyboard['a'] ? 1 : 0) - (input.keyboard['d'] ? 1 : 0);
        
        // Update physics component with raw input values
        physics.acceleration = forwardInput;
        physics.steerAngle = turnInput;

        // Update drifting state
        physics.isDrifting = input.keyboard['shift'] && turnInput !== 0 && Math.abs(physics.speed) > 0.1;
      }
    }
  }
} 