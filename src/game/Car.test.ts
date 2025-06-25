import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { createCar, updateCarPhysics } from './Car';
import { config } from '../config';

// Mock the scene's add method so we don't need a full scene object
const mockScene = {
  add: vi.fn(),
};

describe('Car Module', () => {
  describe('createCar', () => {
    it('should create a car mesh and a vehicle physics object with default values', () => {
      // We cast the mock scene to `any` to satisfy TypeScript
      const { car, vehicle } = createCar(mockScene as any);

      // Test that the car mesh is a valid Three.js Mesh
      expect(car).toBeInstanceOf(THREE.Mesh);
      expect(car.geometry).toBeInstanceOf(THREE.BoxGeometry);
      expect(car.material).toBeInstanceOf(THREE.MeshPhongMaterial);
      expect(car.castShadow).toBe(true);
      
      // Test that the car was added to the scene
      expect(mockScene.add).toHaveBeenCalledWith(car);

      // Test that the vehicle physics object is initialized correctly
      expect(vehicle).toBeDefined();
      expect(vehicle.speed).toBe(0);
      expect(vehicle.acceleration).toBe(0);
      expect(vehicle.steerAngle).toBe(0);
      expect(vehicle.wheelBase).toBe(config.vehicle.wheelBase);
    });
  });

  describe('updateCarPhysics', () => {
    it('should increase speed when accelerating forward', () => {
      const car = new THREE.Mesh(); // A mock mesh is sufficient
      const vehicle = { speed: 0, acceleration: 0, steerAngle: 0, wheelBase: 1.5 };
      const input = { forward: 1, turn: 0 }; // Full throttle forward

      updateCarPhysics(car, vehicle, input);

      // Speed should increase by enginePower, then be reduced slightly by friction
      const expectedSpeed = (0 + config.vehicle.enginePower) * config.vehicle.friction;
      expect(vehicle.speed).toBeCloseTo(expectedSpeed);
    });
    
    it('should apply friction even when there is no input', () => {
        const car = new THREE.Mesh();
        const vehicle = { speed: 1, acceleration: 0, steerAngle: 0, wheelBase: 1.5 };
        const input = { forward: 0, turn: 0 }; // No input

        updateCarPhysics(car, vehicle, input);

        expect(vehicle.speed).toBe(1 * config.vehicle.friction);
    });
    
    it('should update car rotation based on turn input and speed', () => {
      const car = new THREE.Mesh();
      car.rotation.y = 0;
      const vehicle = { speed: 1, acceleration: 0, steerAngle: 0, wheelBase: 1.5 };
      const input = { forward: 0, turn: 1 }; // Full turn right, constant speed

      updateCarPhysics(car, vehicle, input);

      // The car should turn by a predictable amount
      const expectedRotation = config.vehicle.turnSpeed * (1 / 1.0);
      expect(car.rotation.y).toBeCloseTo(expectedRotation);
    });

    it('should move the car forward based on its speed and orientation', () => {
        const car = new THREE.Mesh();
        car.position.set(0, 0, 0);
        car.quaternion.identity(); // Facing the default -Z direction
        const vehicle = { speed: 1, acceleration: 0, steerAngle: 0, wheelBase: 1.5 };
        const input = { forward: 0, turn: 0 }; // No input, just coasting

        // Calculate expected speed after friction is applied
        const expectedSpeed = vehicle.speed * config.vehicle.friction;
        const movement = updateCarPhysics(car, vehicle, input);

        expect(car.position.x).toBeCloseTo(0);
        expect(car.position.y).toBeCloseTo(0);
        // Position should be updated in the negative Z direction
        expect(car.position.z).toBeCloseTo(-expectedSpeed);
        // The returned movement vector should match
        expect(movement.z).toBeCloseTo(-expectedSpeed);
    });
  });
}); 