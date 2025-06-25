import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AIController } from './AIController';
import { Car } from './Car';

// Mock the Car class
const createMockCar = (position: THREE.Vector3): Car => ({
  position,
  // Add any other properties or methods needed for the tests
  rotation: new THREE.Euler(),
  quaternion: new THREE.Quaternion(),
  children: [],
  add: vi.fn(),
  remove: vi.fn(),
  // ... and so on for the full THREE.Mesh interface if needed
} as unknown as Car);


describe('AIController', () => {
  let aiCar: Car;
  let playerCar: Car;
  let waypoints: THREE.Vector3[];
  let aiController: AIController;

  beforeEach(() => {
    // Reset mocks and setup initial state for each test
    vi.clearAllMocks();

    const aiCarPosition = new THREE.Vector3(0, 0, 0);
    aiCar = createMockCar(aiCarPosition);

    const playerCarPosition = new THREE.Vector3(10, 0, 10);
    playerCar = createMockCar(playerCarPosition);

    waypoints = [
      new THREE.Vector3(10, 0, 0),
      new THREE.Vector3(10, 0, 10),
      new THREE.Vector3(0, 0, 10),
    ];

    aiController = new AIController(aiCar, playerCar, waypoints, 0.1);
  });

  it('should be created successfully', () => {
    expect(aiController).toBeInstanceOf(AIController);
  });

  it('should move the AI car towards the current waypoint', () => {
    const initialPosition = aiCar.position.clone();
    aiController.update();
    // The car should have moved from its initial spot
    expect(aiCar.position.equals(initialPosition)).toBe(false);
    // And it should be closer to the first waypoint
    const distanceAfterUpdate = aiCar.position.distanceTo(waypoints[0]);
    expect(distanceAfterUpdate).toBeLessThan(initialPosition.distanceTo(waypoints[0]));
  });

  it('should switch to the next waypoint when close enough', () => {
    // Set car position very close to the first waypoint
    aiCar.position.set(9.9, 0, 0);
    aiController.update();
    // The current waypoint index should now be 1
    expect(aiController['currentWaypointIndex']).toBe(1);
  });

  it('should increase speed when far from the player (rubber banding)', () => {
    playerCar.position.set(100, 0, 100); // Move player far away
    aiController.update();
    // The speed should be greater than the base speed
    expect(aiController['speed']).toBeGreaterThan(aiController['baseSpeed']);
  });

  it('should decrease speed for sharp turns', () => {
    // A less-than-perfect dot product indicates a turn.
    // We'll manually set the car on a path that creates a sharp turn ahead.
    aiCar.position.set(5, 0, -5);
    waypoints = [
        new THREE.Vector3(10, 0, 0), // Straight ahead
        new THREE.Vector3(10, 0, 10)  // Then sharp left
    ];
    aiController = new AIController(aiCar, playerCar, waypoints, 0.1);
    
    const initialSpeed = aiController['speed'];
    aiController.update();
    // Speed should be reduced due to the upcoming turn
    expect(aiController['speed']).toBeLessThan(initialSpeed);
  });
  
}); 