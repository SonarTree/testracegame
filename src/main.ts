import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xabcdef);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(20, 50, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('app')?.appendChild(renderer.domElement);

// Car
const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
const carMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.castShadow = true;
scene.add(car);

const carPhysics = {
    velocity: new THREE.Vector3(),
    engineForce: 0.015,
    brakingForce: 0.02,
    sidewaysGrip: 0.9,
    drag: 0.99,
    turnSpeed: 0.025,
    restitution: 0.4, // Bounciness
    driftGrip: 0.6, // Less grip when drifting
    driftTriggerSpeed: 0.6, // Speed needed to drift
};

let gameStarted = false;
let isDrifting = false;
let boost = 0;
let cameraShakeIntensity = 0;

const tireMarks: THREE.Mesh[] = [];
const tireMarkMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
});

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x404040, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Track walls
const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xa0a0a0 });

const wall1 = new THREE.Mesh(new THREE.BoxGeometry(100, 2, 2), wallMaterial);
wall1.position.z = -20;
wall1.castShadow = true;
wall1.receiveShadow = true;
scene.add(wall1);

const wall2 = new THREE.Mesh(new THREE.BoxGeometry(100, 2, 2), wallMaterial);
wall2.position.z = 20;
wall2.castShadow = true;
wall2.receiveShadow = true;
scene.add(wall2);

const wall3 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 40), wallMaterial);
wall3.position.x = -50;
wall3.castShadow = true;
wall3.receiveShadow = true;
scene.add(wall3);

const wall4 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 40), wallMaterial);
wall4.position.x = 50;
wall4.castShadow = true;
wall4.receiveShadow = true;
scene.add(wall4);

const walls = [
    { mesh: wall1, normal: new THREE.Vector3(0, 0, 1) },
    { mesh: wall2, normal: new THREE.Vector3(0, 0, -1) },
    { mesh: wall3, normal: new THREE.Vector3(1, 0, 0) },
    { mesh: wall4, normal: new THREE.Vector3(-1, 0, 0) },
];

// Start/Finish Line
const finishLine = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 5),
  new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/checker.png') })
);
finishLine.position.z = 0;
finishLine.position.x = -45;
finishLine.rotation.y = Math.PI / 2;
scene.add(finishLine);
const finishLinePlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(1, 0, 0), finishLine.position);

let lap = 0;
let raceStartTime = 0;
let lapStartTime = 0;
let previousPosition = car.position.clone();

const lapsElement = document.getElementById('laps');
const timeElement = document.getElementById('time');
const lapTimeElement = document.getElementById('lap-time');
const speedElement = document.getElementById('speed');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

startButton?.addEventListener('click', () => {
  gameStarted = true;
  raceStartTime = Date.now();
  lapStartTime = Date.now();
  startButton.style.display = 'none';
});

restartButton?.addEventListener('click', () => {
  car.position.set(0, 0, 0);
  car.rotation.set(0, 0, 0);
  carPhysics.velocity.set(0, 0, 0);
  lap = 0;
  raceStartTime = Date.now();
  lapStartTime = Date.now();
});

// AI Opponent
const aiCarGeometry = new THREE.BoxGeometry(1, 0.5, 2);
const aiCarMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
const aiCar = new THREE.Mesh(aiCarGeometry, aiCarMaterial);
aiCar.castShadow = true;
aiCar.receiveShadow = true;
aiCar.position.z = -5;
scene.add(aiCar);

const waypoints = [
  new THREE.Vector3(-40, 0, -10),
  new THREE.Vector3(40, 0, -10),
  new THREE.Vector3(40, 0, 10),
  new THREE.Vector3(-40, 0, 10),
];
let currentWaypointIndex = 0;

// Keyboard state
const keyboard: { [key: string]: boolean } = {};

document.addEventListener('keydown', (event) => {
  keyboard[event.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (event) => {
  keyboard[event.key.toLowerCase()] = false;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) {
    // Cinematic start camera
    const time = Date.now() * 0.0005;
    camera.position.x = Math.sin(time) * 10;
    camera.position.z = Math.cos(time) * 10;
    camera.position.y = 5;
    camera.lookAt(car.position);
    renderer.render(scene, camera);
    return;
  }

  if (raceStartTime === 0) {
    raceStartTime = Date.now();
    lapStartTime = Date.now();
  }

  const elapsedTime = (Date.now() - raceStartTime) / 1000;
  const currentLapTime = (Date.now() - lapStartTime) / 1000;

  if (lapsElement) lapsElement.innerText = lap.toString();
  if (timeElement) timeElement.innerText = elapsedTime.toFixed(2);
  if (lapTimeElement) lapTimeElement.innerText = currentLapTime.toFixed(2);

  // --- Physics Simulation START ---

  // 1. Get Player Input
  const forwardInput = (keyboard['w'] ? 1 : 0) - (keyboard['s'] ? 1 : 0);
  const turnInput = (keyboard['a'] ? 1 : 0) - (keyboard['d'] ? 1 : 0);

  // 2. Update Rotation
  const currentSpeed = carPhysics.velocity.length();
  const turnAmount = turnInput * carPhysics.turnSpeed * Math.min(currentSpeed, 1.0);
  car.rotation.y += turnAmount;

  // 3. Apply Engine/Braking Forces
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion);
  const forwardVelocity = carPhysics.velocity.dot(forward);

  if (forwardInput > 0) {
      carPhysics.velocity.add(forward.multiplyScalar(carPhysics.engineForce));
  } else if (forwardInput < 0) {
      if (forwardVelocity > 0.01) {
          // If moving forward, apply brakes opposite to the velocity direction
          const brakeForce = carPhysics.velocity.clone().normalize().multiplyScalar(-carPhysics.brakingForce);
          carPhysics.velocity.add(brakeForce);
      } else {
          // If stationary or moving backward, apply reverse thrust
          carPhysics.velocity.add(forward.multiplyScalar(-carPhysics.engineForce * 0.7));
      }
  }

  // 4. Apply Friction & Drifting
  const wasDrifting = isDrifting;
  isDrifting = currentSpeed > carPhysics.driftTriggerSpeed && turnInput !== 0;

  const localVelocity = carPhysics.velocity.clone().applyQuaternion(car.quaternion.clone().invert());

  if (isDrifting) {
      localVelocity.x *= carPhysics.driftGrip;
      boost += 0.002; // Accumulate boost
  } else {
      localVelocity.x *= carPhysics.sidewaysGrip;
      if (wasDrifting) { // Apply boost when drift ends
          const forwardBoost = new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion).multiplyScalar(boost);
          carPhysics.velocity.add(forwardBoost);
          boost = 0;
      }
  }
  localVelocity.z *= carPhysics.drag;
  carPhysics.velocity.copy(localVelocity.applyQuaternion(car.quaternion));
  
  // Tire marks
  if (isDrifting) {
      createTireMark(car.position.clone().sub(new THREE.Vector3(0, car.geometry.parameters.height / 2 - 0.01, 0)));
  }
  
  // 5. Update Position
  car.position.add(carPhysics.velocity);
  
  // 6. Collision Detection
  const carBBoxAfterMove = new THREE.Box3().setFromObject(car);
  for (const wall of walls) {
      const wallBBox = new THREE.Box3().setFromObject(wall.mesh);
      if (carBBoxAfterMove.intersectsBox(wallBBox)) {
          car.position.copy(previousPosition);
          carPhysics.velocity.reflect(wall.normal).multiplyScalar(carPhysics.restitution);
          cameraShakeIntensity = 0.2;
          break;
      }
  }
  
  // --- Physics Simulation END ---

  // Update UI
  if (speedElement) speedElement.innerText = (carPhysics.velocity.length() * 200).toFixed(0);

  // AI Car movement
  const aiSpeed = 0.08;
  const waypoint = waypoints[currentWaypointIndex];
  const distanceToWaypoint = aiCar.position.distanceTo(waypoint);

  if (distanceToWaypoint < 1) {
    currentWaypointIndex = (currentWaypointIndex + 1) % waypoints.length;
  } else {
    const direction = waypoint.clone().sub(aiCar.position).normalize();
    aiCar.position.add(direction.multiplyScalar(aiSpeed));
    aiCar.lookAt(waypoint);
  }

  // Make camera follow the car
  const cameraOffset = new THREE.Vector3(0, 2, 5);
  const carPosition = car.position.clone();

  // Apply car's rotation to the offset
  const cameraBehind = cameraOffset.clone().applyQuaternion(car.quaternion);

  const cameraPosition = carPosition.add(cameraBehind);
  camera.position.copy(cameraPosition);
  camera.lookAt(car.position);

  if (cameraShakeIntensity > 0) {
    camera.position.x += (Math.random() - 0.5) * cameraShakeIntensity;
    camera.position.y += (Math.random() - 0.5) * cameraShakeIntensity;
    cameraShakeIntensity *= 0.9; // Decay shake
  }

  previousPosition.copy(car.position);
  renderer.render(scene, camera);
}

function createTireMark(position: THREE.Vector3) {
  const decalSize = new THREE.Vector3(0.5, 2, 0.5);
  const decalRotation = new THREE.Euler(car.rotation.x - Math.PI / 2, car.rotation.y, car.rotation.z);
  const decalGeometry = new DecalGeometry(ground, position, decalRotation, decalSize);
  const tireMark = new THREE.Mesh(decalGeometry, tireMarkMaterial);
  scene.add(tireMark);

  tireMarks.push(tireMark);
  if (tireMarks.length > 100) {
    const oldMark = tireMarks.shift();
    if (oldMark) {
        scene.remove(oldMark);
        oldMark.geometry.dispose();
    }
  }
}

animate(); 