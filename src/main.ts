import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { config } from './config';
import { updateUI, startButton, restartButton } from './ui/GameUI';
import { createTrack } from './game/Track';
import { createCar, updateCarPhysics } from './game/Car';

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

const { road, innerRadius, outerRadius, finishLinePlane } = createTrack(scene);
const { car, vehicle } = createCar(scene);
car.position.x = config.track.radius; // Place car on the track's centerline

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

let lap = 0;
let raceStartTime = 0;
let lapStartTime = 0;
let previousPosition = car.position.clone();

// AI Opponent
const aiCar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
aiCar.position.set(config.track.radius, 0, 2); // Start AI near player on the track
aiCar.castShadow = true;
scene.add(aiCar);

const waypoints: THREE.Vector3[] = [];
const numWaypoints = 32; // More waypoints for a smoother path
for (let i = 0; i < numWaypoints; i++) {
    const angle = (i / numWaypoints) * 2 * Math.PI;
    waypoints.push(
        new THREE.Vector3(Math.cos(angle) * config.track.radius, 0, Math.sin(angle) * config.track.radius)
    );
}
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

  updateUI({
    lap,
    elapsedTime,
    currentLapTime,
    speed: vehicle.speed,
  });

  // --- Physics Simulation START ---
  const previousPosition = car.position.clone();

  // 1. Get Player Input
  const forwardInput = (keyboard['w'] ? 1 : 0) - (keyboard['s'] ? 1 : 0);
  const turnInput = (keyboard['a'] ? 1 : 0) - (keyboard['d'] ? 1 : 0);

  // The core physics logic is now in this one function call
  const movement = updateCarPhysics(car, vehicle, { forward: forwardInput, turn: turnInput });
  
  // --- Collision Detection ---
  const carRadius = car.position.length();
  if (carRadius > outerRadius || carRadius < innerRadius) {
      car.position.copy(previousPosition);
      vehicle.speed *= -config.vehicle.restitution; // Bounce back
      cameraShakeIntensity = config.camera.shakeIntensity;
  }
  
  // Tire marks
  if (vehicle.steerAngle !== 0) {
      createTireMark(car.position.clone().sub(new THREE.Vector3(0, car.geometry.parameters.height / 2 - 0.01, 0)));
  }
  
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
    cameraShakeIntensity *= config.camera.shakeDecay;
  }

  previousPosition.copy(car.position);
  renderer.render(scene, camera);
}

function createTireMark(position: THREE.Vector3) {
    const decalSize = new THREE.Vector3(0.5, 2, 0.5);
    const decalRotation = new THREE.Euler(car.rotation.x - Math.PI / 2, car.rotation.y, car.rotation.z);
    const decalGeometry = new DecalGeometry(road, position, decalRotation, decalSize);
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

startButton?.addEventListener('click', () => {
  gameStarted = true;
  raceStartTime = Date.now();
  lapStartTime = Date.now();
  if (startButton) startButton.style.display = 'none';
});

restartButton?.addEventListener('click', () => {
  car.position.set(0, 0, 0);
  car.rotation.set(0, 0, 0);
  vehicle.speed = 0;
  lap = 0;
  raceStartTime = Date.now();
  lapStartTime = Date.now();
});

animate(); 