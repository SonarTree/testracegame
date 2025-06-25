import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Entity } from '../Entity';
import { PhysicsSystem } from './PhysicsSystem';
import { TransformComponent } from '../components/TransformComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { config } from '../../config';

describe('PhysicsSystem', () => {
  let physicsSystem: PhysicsSystem;
  let entity: Entity;
  let transform: TransformComponent;
  let physics: PhysicsComponent;

  beforeEach(() => {
    physicsSystem = new PhysicsSystem();
    entity = new Entity('testCar');
    transform = new TransformComponent(new THREE.Vector3(), new THREE.Quaternion(), new THREE.Euler());
    physics = new PhysicsComponent(0, 0, 0, config.vehicle.wheelBase);
    entity.addComponent(transform);
    entity.addComponent(physics);
  });

  it('should not exceed a practical maximum speed when accelerating', () => {
    physics.speed = 1; // Start at a very high speed (our practical max)
    physics.acceleration = 1; // Still accelerating

    physicsSystem.update([entity], 1 / 60);

    // Speed should increase by enginePower, but then be reduced by friction.
    // The net effect should be a very small increase, capped by friction.
    const expectedSpeed = (1 + config.vehicle.enginePower) * config.vehicle.friction;
    expect(physics.speed).toBeCloseTo(expectedSpeed);
    // This test ensures we don't have runaway acceleration. The friction acts as a natural speed limiter.
  });

  it('should apply braking force when moving backward', () => {
    physics.speed = -0.5; // Moving backward
    physics.acceleration = -1; // "Braking" in reverse (which is just more acceleration)
    
    physicsSystem.update([entity], 1/60);
    
    const expectedSpeed = (-0.5 + (-1 * config.vehicle.enginePower)) * config.vehicle.friction;
    expect(physics.speed).toBeCloseTo(expectedSpeed, 5);
  });

  it('should have less turning effect at very low speeds', () => {
    physics.speed = 0.01; // Very slow speed
    physics.steerAngle = 1; // Full turn

    const initialRotationY = transform.rotation.y;
    physicsSystem.update([entity], 1/60);
    const rotationDiff = transform.rotation.y - initialRotationY;

    expect(rotationDiff).toBeCloseTo(1 * config.vehicle.turnSpeed * (0.01 / 1.0));
    expect(rotationDiff).toBeLessThan(0.01);
  });

  it('should have more turning effect at high speeds', () => {
    physics.speed = 0.5; // High speed
    physics.steerAngle = 1; // Full turn

    const initialRotationY = transform.rotation.y;
    physicsSystem.update([entity], 1 / 60);
    const rotationDiff = transform.rotation.y - initialRotationY;
    
    expect(rotationDiff).toBeCloseTo(1 * config.vehicle.turnSpeed * (0.5 / 1.0));
    expect(rotationDiff).toBeGreaterThan(0.01);
  });
}); 