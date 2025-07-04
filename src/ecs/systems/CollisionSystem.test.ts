import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Entity } from '../Entity';
import { CollisionSystem } from './CollisionSystem';
import { TransformComponent } from '../components/TransformComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { config } from '../../config';

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem;
  let entity: Entity;
  let transform: TransformComponent;
  let physics: PhysicsComponent;
  const innerRadius = 30;
  const outerRadius = 40;

  beforeEach(() => {
    collisionSystem = new CollisionSystem(innerRadius, outerRadius);
    entity = new Entity('testCar');
    transform = new TransformComponent(new THREE.Vector3(outerRadius + 1, 0, 0), new THREE.Quaternion(), new THREE.Euler());
    physics = new PhysicsComponent(0.5, 0, 0, config.vehicle.wheelBase);
    entity.addComponent(transform);
    entity.addComponent(physics);
  });

  it('should reverse and dampen speed upon collision with outer boundary', () => {
    const initialSpeed = physics.speed;
    
    collisionSystem.update([entity], 1/60);

    const collisionEvents = collisionSystem.getEvents();
    expect(collisionEvents).toHaveLength(1);
    expect(collisionEvents[0].type).toBe('TRACK_COLLISION');
    expect(physics.speed).toBeCloseTo(initialSpeed * -0.5);
  });

  it('should create a collision event with shake intensity', () => {
    collisionSystem.update([entity], 1/60);
    const events = collisionSystem.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('TRACK_COLLISION');
    expect(events[0].shakeIntensity).toBe(config.camera.shakeIntensity);
  });

  it('should only create one collision event for continuous collision', () => {
    // First collision
    collisionSystem.update([entity], 1/60);
    let events = collisionSystem.getEvents();
    expect(events.length).toBe(1);
    expect(physics.isColliding).toBe(true);

    // Continuous collision
    collisionSystem.update([entity], 1/60);
    events = collisionSystem.getEvents();
    expect(events.length).toBe(0); // No new event should be pushed
  });

  it('should reset isColliding when back on track', () => {
    // First collision
    collisionSystem.update([entity], 1/60);
    expect(physics.isColliding).toBe(true);
    
    // Move back on track
    transform.position.set(35, 0, 0);
    collisionSystem.update([entity], 1/60);
    expect(physics.isColliding).toBe(false);
  });

  it('should not trigger a collision when within track boundaries', () => {
    transform.position.set(35, 0, 0); // Position inside the track
    
    collisionSystem.update([entity], 1/60);

    const collisionEvents = collisionSystem.getEvents();
    expect(collisionEvents).toHaveLength(0);
    expect(physics.speed).toBe(0.5); // Speed should be unchanged
  });
}); 