import * as THREE from 'three';

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

let speed = 0;
let acceleration = 0;
let steerAngle = 0;
const maxSteer = Math.PI / 4;
const maxSpeed = 1.0;
const enginePower = 0.01;
const brakingForce = 0.02;
const friction = 0.99;
const turnSpeed = 0.035;

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

let gameStarted = false;

startButton?.addEventListener('click', () => {
  gameStarted = true;
  raceStartTime = Date.now();
  lapStartTime = Date.now();
  startButton.style.display = 'none';
});

restartButton?.addEventListener('click', () => {
  car.position.set(0, 0, 0);
  car.rotation.set(0, 0, 0);
  speed = 0;
  acceleration = 0;
  steerAngle = 0;
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

const walls = [wall1, wall2, wall3, wall4];
const wallBoundingBoxes = walls.map(wall => new THREE.Box3().setFromObject(wall));

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
  if (speedElement) speedElement.innerText = (speed * 100).toFixed(0);

  // Input
  const forwardInput = (keyboard['w'] ? 1 : 0) - (keyboard['s'] ? 1 : 0);
  const turnInput = (keyboard['a'] ? 1 : 0) - (keyboard['d'] ? 1 : 0);

  // Acceleration and Braking
  acceleration = forwardInput * enginePower;
  if (keyboard['s']) {
      if (speed > 0) {
          acceleration -= brakingForce;
      }
  }

  // Update speed
  speed += acceleration;
  speed *= friction; // Apply friction

  // Cap speed
  if (speed > maxSpeed) speed = maxSpeed;
  if (speed < -maxSpeed / 2) speed = -maxSpeed / 2;

  // Update steering
  steerAngle = turnInput * maxSteer;

  // Update car rotation based on speed and steering
  if (Math.abs(speed) > 0.01) {
    car.rotation.y += turnInput * turnSpeed * (speed / maxSpeed);
  }

  // Update position
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion);
  car.position.add(forward.multiplyScalar(speed));

  const carBBoxAfterMove = new THREE.Box3().setFromObject(car);
  for (const wallBox of wallBoundingBoxes) {
    if (carBBoxAfterMove.intersectsBox(wallBox)) {
      car.position.copy(previousPosition);
      speed *= -0.5; // Reverse and dampen speed on collision
      break;
    }
  }

  const carVelocity = car.position.clone().sub(previousPosition);

  const isCrossing = finishLinePlane.distanceToPoint(previousPosition) * finishLinePlane.distanceToPoint(car.position) < 0;

  if (isCrossing && carVelocity.dot(finishLinePlane.normal) > 0) {
      lap++;
      lapStartTime = Date.now();
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

  previousPosition.copy(car.position);
  renderer.render(scene, camera);
}

animate(); 