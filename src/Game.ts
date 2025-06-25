import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { GameState } from './game/GameState';
import { config } from './config';
import {
  updateUI,
  showMainMenu,
  showGameHud,
  showRaceOverMenu,
  startButton,
  restartButton,
  updateMinimap,
  showNotification,
} from './ui/GameUI';
import { createTrack } from './game/Track';
import { createCar, updateCarPhysics, Car, Vehicle } from './game/Car';
import SoundManager from './game/SoundManager';
import { AIController } from './game/AIController';
import { PowerUpManager } from './game/PowerUpManager';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  public state: GameState;
  private soundManager: SoundManager;

  private road!: THREE.Mesh;
  private innerRadius!: number;
  private outerRadius!: number;
  private car!: Car;
  private vehicle!: Vehicle;

  private lap = 0;
  private passedHalfway = false;
  private lastQuadrant = 0;
  private raceStartTime = 0;
  private lapStartTime = 0;
  private cameraShakeIntensity = 0;
  private isGoingWrongWay = false;

  private tireMarks: THREE.Mesh[] = [];
  private tireMarkMaterial: THREE.MeshBasicMaterial;

  private aiCar!: THREE.Mesh;
  private aiController!: AIController;
  private powerUpManager!: PowerUpManager;

  private keyboard: { [key: string]: boolean } = {};

  private constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.state = GameState.MAIN_MENU;
    this.soundManager = new SoundManager(this.camera);

    this.tireMarkMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
  }

  public static async create() {
    const game = new Game();
    await game.init();
    game.animate();
    return game;
  }

  private async init() {
    // Scene setup
    this.scene.background = new THREE.Color(0xabcdef);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 50, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
    
    // Camera
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('app')?.appendChild(this.renderer.domElement);

    // Sounds
    try {
      await this.loadSounds();
    } catch (error) {
      console.error("Could not load sounds. The game will continue without audio.", error);
    }

    // Track
    const { road, innerRadius, outerRadius } = createTrack(this.scene);
    this.road = road;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;

    // Car
    const { car, vehicle } = createCar(this.scene);
    this.car = car;
    this.vehicle = vehicle;
    this.car.position.set(config.track.radius, 0.25, 0);
    this.car.rotation.y = Math.PI;

    // AI Car
    this.aiCar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
    this.aiCar.position.set(config.track.radius, 0.25, 2);
    this.aiCar.rotation.y = Math.PI;
    this.aiCar.castShadow = true;
    this.scene.add(this.aiCar);

    const numWaypoints = 32;
    const waypoints: THREE.Vector3[] = [];
    for (let i = 0; i < numWaypoints; i++) {
      const angle = (i / numWaypoints) * 2 * Math.PI;
      waypoints.push(
        new THREE.Vector3(
          Math.cos(angle) * config.track.radius,
          0,
          Math.sin(angle) * config.track.radius
        )
      );
    }
    this.aiController = new AIController(this.aiCar, waypoints);
    
    const powerUpSpawnPositions = [
      new THREE.Vector3(config.track.radius, 0.5, 0),
      new THREE.Vector3(-config.track.radius, 0.5, 0),
      new THREE.Vector3(0, 0.5, config.track.radius),
      new THREE.Vector3(0, 0.5, -config.track.radius),
      new THREE.Vector3(
        config.track.radius * Math.cos(Math.PI / 4),
        0.5,
        config.track.radius * Math.sin(Math.PI / 4)
      ),
      new THREE.Vector3(
        config.track.radius * Math.cos((3 * Math.PI) / 4),
        0.5,
        config.track.radius * Math.sin((3 * Math.PI) / 4)
      ),
      new THREE.Vector3(
        config.track.radius * Math.cos((5 * Math.PI) / 4),
        0.5,
        config.track.radius * Math.sin((5 * Math.PI) / 4)
      ),
      new THREE.Vector3(
        config.track.radius * Math.cos((7 * Math.PI) / 4),
        0.5,
        config.track.radius * Math.sin((7 * Math.PI) / 4)
      ),
    ];
    this.powerUpManager = new PowerUpManager(
      this.scene,
      powerUpSpawnPositions
    );

    // Event Listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('keydown', (event) => { this.keyboard[event.key.toLowerCase()] = true; });
    document.addEventListener('keyup', (event) => { this.keyboard[event.key.toLowerCase()] = false; });

    startButton?.addEventListener('click', () => this.startGame());
    restartButton?.addEventListener('click', () => this.returnToMenu());
    
    this.setState(GameState.MAIN_MENU);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public setState(newState: GameState) {
    this.state = newState;
    
    switch (this.state) {
      case GameState.MAIN_MENU:
        showMainMenu();
        break;
      case GameState.PLAYING:
        showGameHud();
        break;
      case GameState.RACE_OVER:
        showRaceOverMenu((Date.now() - this.raceStartTime) / 1000, this.lap);
        break;
    }
  }

  public startGame() {
    this.setState(GameState.PLAYING);
    this.raceStartTime = Date.now();
    this.lapStartTime = Date.now();
    this.powerUpManager.start();
  }
  
  public returnToMenu() {
    this.car.position.set(config.track.radius, 0.25, 0);
    this.car.rotation.y = Math.PI;
    this.vehicle.speed = 0;
    this.lap = 0;
    this.passedHalfway = false;
    this.lastQuadrant = this.getQuadrant(this.car.position);
    this.setState(GameState.MAIN_MENU);
    this.soundManager.stopSound('engine');
    this.soundManager.stopSound('drifting');
  }

  private getQuadrant(position: THREE.Vector3) {
    if (position.x >= 0 && position.z > 0) return 1;
    if (position.x < 0 && position.z >= 0) return 2;
    if (position.x <= 0 && position.z < 0) return 3;
    if (position.x > 0 && position.z <= 0) return 4;
    return 0; // Should not happen on the track
  }
  
  private async loadSounds() {
    await this.soundManager.loadSound('engine', '/audio/engine.wav', true);
    await this.soundManager.loadSound('collision1', '/audio/collision 1.wav');
    await this.soundManager.loadSound('collision2', '/audio/collision 2.wav');
    await this.soundManager.loadSound('finish-line', '/audio/finishline.wav');
    await this.soundManager.loadSound('drifting', '/audio/drifting.wav', true);
  }

  private createTireMark(position: THREE.Vector3) {
    const decalSize = new THREE.Vector3(0.5, 2, 0.5);
    const decalRotation = new THREE.Euler(this.car.rotation.x - Math.PI / 2, this.car.rotation.y, this.car.rotation.z);
    const decalGeometry = new DecalGeometry(this.road, position, decalRotation, decalSize);
    const tireMark = new THREE.Mesh(decalGeometry, this.tireMarkMaterial);
    this.scene.add(tireMark);

    this.tireMarks.push(tireMark);
    if (this.tireMarks.length > 100) {
      const oldMark = this.tireMarks.shift();
      if (oldMark) {
        this.scene.remove(oldMark);
        oldMark.geometry.dispose();
      }
    }
  }

  private update() {
    const elapsedTime = (Date.now() - this.raceStartTime) / 1000;
    const currentLapTime = (Date.now() - this.lapStartTime) / 1000;

    updateUI({
      lap: this.lap,
      elapsedTime,
      currentLapTime,
      speed: this.vehicle.speed,
    });

    updateMinimap(this.car.position, this.aiCar.position, config.track.radius);

    // --- Physics Simulation START ---
    const previousPosition = this.car.position.clone();

    // 1. Get Player Input
    const forwardInput = (this.keyboard['w'] ? 1 : 0) - (this.keyboard['s'] ? 1 : 0);
    const turnInput = (this.keyboard['a'] ? 1 : 0) - (this.keyboard['d'] ? 1 : 0);
    const isDrifting = this.keyboard['shift'] && turnInput !== 0 && Math.abs(this.vehicle.speed) > 0.1;

    // The core physics logic is now in this one function call
    const movement = updateCarPhysics(
      this.car,
      this.vehicle,
      { forward: forwardInput, turn: turnInput },
      isDrifting
    );

    // --- Collision Detection ---
    const carRadius = this.car.position.length();
    if (carRadius > this.outerRadius || carRadius < this.innerRadius) {
      this.car.position.copy(previousPosition);
      this.vehicle.speed *= -config.vehicle.restitution; // Bounce back
      this.cameraShakeIntensity = config.camera.shakeIntensity;
      const collisionSound = Math.random() > 0.5 ? 'collision1' : 'collision2';
      this.soundManager.playSound(collisionSound);
    }

    // Engine sound
    const isAccelerating = forwardInput !== 0
    if (isAccelerating || Math.abs(this.vehicle.speed) > 0.05) {
      this.soundManager.playSound('engine');
    } else {
      this.soundManager.stopSound('engine');
    }

    // Tire marks & drifting sound
    if (isDrifting) {
      this.createTireMark(
        this.car.position
          .clone()
          .sub(
            new THREE.Vector3(
              0,
              (this.car.geometry as THREE.BoxGeometry).parameters.height / 2 -
                0.01,
              0
            )
          )
      );
      this.soundManager.playSound('drifting');
    } else {
      this.soundManager.stopSound('drifting');
    }

    // Lap Detection using Quadrants
    const currentQuadrant = this.getQuadrant(this.car.position);
    if (currentQuadrant !== this.lastQuadrant) {
      // Wrong Way Detection
      const isForward = currentQuadrant === (this.lastQuadrant % 4) + 1;
      const isBackward = this.lastQuadrant === (currentQuadrant % 4) + 1;

      if (isBackward) {
        this.passedHalfway = false; // Invalidate lap progress on any backward movement
        if (this.state === GameState.PLAYING && !this.isGoingWrongWay) {
          showNotification('Wrong Way!', 2000);
          this.isGoingWrongWay = true;
        }
      } else if (isForward) {
        this.isGoingWrongWay = false;
      }

      if (currentQuadrant === 1 && this.lastQuadrant === 4) {
        // Crossed finish line
        if (this.passedHalfway) {
          // Check for race completion BEFORE incrementing lap
          if (this.lap === config.race.laps) {
            this.setState(GameState.RACE_OVER);
            this.soundManager.playSound('finish-line');
            this.soundManager.stopSound('engine');
            this.soundManager.stopSound('drifting');
            return; // Stop further processing this frame
          }

          this.lap++;
          this.lapStartTime = Date.now();
          this.passedHalfway = false;

          if (this.lap === config.race.laps) {
            showNotification('Final Lap!');
          }
        }
      } else if (currentQuadrant === 3 && this.lastQuadrant === 2) {
        this.passedHalfway = true;
      }
      this.lastQuadrant = currentQuadrant;
    }

    this.powerUpManager.update(this.car, this.vehicle);
    this.aiController.update();

    // Make camera follow the car
    const cameraOffset = new THREE.Vector3(0, 2, 5);
    const carPosition = this.car.position.clone();
    const cameraBehind = cameraOffset.clone().applyQuaternion(this.car.quaternion);
    const cameraPosition = carPosition.add(cameraBehind);
    this.camera.position.copy(cameraPosition);
    this.camera.lookAt(this.car.position);

    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity *= config.camera.shakeDecay;
    }
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    switch (this.state) {
        case GameState.MAIN_MENU:
            // Rotating camera around the scene
            const time = Date.now() * 0.0002;
            this.camera.position.x = Math.sin(time) * 20;
            this.camera.position.z = Math.cos(time) * 20;
            this.camera.position.y = 10;
            this.camera.lookAt(0, 0, 0);
            break;
        case GameState.PLAYING:
            this.update();
            break;
        case GameState.RACE_OVER:
            // Keep rendering the scene but don't update game logic
            break;
    }

    this.renderer.render(this.scene, this.camera);
  }
} 