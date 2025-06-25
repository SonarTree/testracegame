import * as THREE from 'three';
import { config } from '../config';

export function createCar(scene: THREE.Scene) {
    const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const carMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const car = new THREE.Mesh(carGeometry, carMaterial);
    car.castShadow = true;
    scene.add(car);

    const vehicle = {
        speed: 0,
        acceleration: 0,
        steerAngle: 0,
        wheelBase: config.vehicle.wheelBase,
    };

    return { car, vehicle };
}

export function updateCarPhysics(
    car: THREE.Mesh,
    vehicle: { speed: number; acceleration: number; steerAngle: number; wheelBase: number },
    input: { forward: number; turn: number }
) {
    // 1. Update Steering Angle
    vehicle.steerAngle = input.turn * config.vehicle.maxSteer;

    // 2. Update Speed (Acceleration, Braking, Friction)
    const currentAcceleration = input.forward * config.vehicle.enginePower;
    vehicle.speed += currentAcceleration;

    if (input.forward < 0 && vehicle.speed > 0) {
        vehicle.speed -= config.vehicle.brakingForce;
    }

    vehicle.speed *= config.vehicle.friction;

    // 3. Update Rotation & Position
    car.rotation.y += input.turn * config.vehicle.turnSpeed * (vehicle.speed / 1.0);
    
    // 4. Move the car
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion);
    const movement = forward.multiplyScalar(vehicle.speed);
    car.position.add(movement);

    return movement;
} 