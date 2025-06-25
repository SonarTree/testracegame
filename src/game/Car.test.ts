import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createCar, updateCarPhysics, Car, Vehicle } from './Car';
import { config } from '../config';

// Mock the scene's add method so we don't need a full scene object
const mockScene = {
  add: vi.fn(),
};

describe('Car Module', () => {
  let car: Car;
  let vehicle: Vehicle;

  beforeEach(() => {
    car = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2)) as Car;
    vehicle = {
      speed: 0,
      acceleration: 0,
      steerAngle: 0,
      wheelBase: 1.5,
    };
  });

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
    it('should accelerate forward', () => {
      updateCarPhysics(car, vehicle, { forward: 1, turn: 0 }, false);
      expect(vehicle.speed).toBeGreaterThan(0);
    });

    it('should brake', () => {
      vehicle.speed = 0.1;
      updateCarPhysics(car, vehicle, { forward: -1, turn: 0 }, false);
      expect(vehicle.speed).toBeLessThan(0.1);
    });

    it('should turn left and right', () => {
      vehicle.speed = 0.1;
      const initialRotation = car.rotation.y;
      updateCarPhysics(car, vehicle, { forward: 0, turn: 1 }, false);
      expect(car.rotation.y).not.toBe(initialRotation);
    });

    it('should apply normal friction', () => {
      vehicle.speed = 0.1;
      updateCarPhysics(car, vehicle, { forward: 0, turn: 0 }, false);
      expect(vehicle.speed).toBe(0.1 * config.vehicle.friction);
    });

    it('should apply drift friction when drifting', () => {
      vehicle.speed = 0.1;
      updateCarPhysics(car, vehicle, { forward: 0, turn: 1 }, true);
      expect(vehicle.speed).toBe(0.1 * config.vehicle.driftFriction);
    });
  });
}); 