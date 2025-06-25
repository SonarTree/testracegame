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
import SoundManager from './game/SoundManager';
import { PowerUpManager } from './game/PowerUpManager';

// ECS Imports
import { EntityManager } from './ecs/EntityManager';
import { Entity } from './ecs/Entity';
import { TransformComponent } from './ecs/components/TransformComponent';
import { RenderComponent } from './ecs/components/RenderComponent';
import { PhysicsComponent } from './ecs/components/PhysicsComponent';
import { PlayerInputComponent } from './ecs/components/PlayerInputComponent';
import { AIControlComponent } from './ecs/components/AIControlComponent';
import { LapTrackerComponent } from './ecs/components/LapTrackerComponent';
import { InputSystem } from './ecs/systems/InputSystem';
import { PhysicsSystem } from './ecs/systems/PhysicsSystem';
import { AISystem } from './ecs/systems/AISystem';
import { LapSystem, LapSystemEvent } from './ecs/systems/LapSystem';
import { RenderSystem } from './ecs/systems/RenderSystem';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  public state: GameState;
  private soundManager: SoundManager;

  // ECS
  private entityManager: EntityManager;
  private inputSystem: InputSystem;
  private physicsSystem: PhysicsSystem;
  private aiSystem: AISystem;
  private lapSystem: LapSystem;
  private renderSystem: RenderSystem;

  private road!: THREE.Mesh;
  private innerRadius!: number;
  private outerRadius!: number;

  private raceStartTime = 0;
  private lapStartTime = 0;
  private cameraShakeIntensity = 0;

  private tireMarks: THREE.Mesh[] = [];
  private tireMarkMaterial: THREE.MeshBasicMaterial;

  private powerUpManager!: PowerUpManager;

  private keyboard: { [key: string]: boolean } = {};

  private constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.state = GameState.MAIN_MENU;
    this.soundManager = new SoundManager(this.camera);

    this.entityManager = new EntityManager();
    this.inputSystem = new InputSystem();
    this.physicsSystem = new PhysicsSystem();
    this.aiSystem = new AISystem();
    this.lapSystem = new LapSystem();
    this.renderSystem = new RenderSystem();

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
    const loader = new THREE.CubeTextureLoader();
    loader.setPath('/textures/skybox/'); // Relative to /public
    const textureCube = loader.load([
      'px.jpg', 'nx.jpg',
      'py.jpg', 'ny.jpg',
      'pz.jpg', 'nz.jpg'
    ]);
    this.scene.background = textureCube;

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

    this.createTrees();

    // Player Entity
    const playerCarMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
    playerCarMesh.castShadow = true;
    this.scene.add(playerCarMesh);
    const playerEntity = new Entity('player');
    const playerTransform = new TransformComponent(
        new THREE.Vector3(config.track.radius, 0.25, 0),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
        new THREE.Euler(0, Math.PI, 0)
    );
    playerEntity.addComponent(playerTransform);
    playerEntity.addComponent(new RenderComponent(playerCarMesh));
    playerEntity.addComponent(new PhysicsComponent(0, 0, 0, config.vehicle.wheelBase));
    playerEntity.addComponent(new PlayerInputComponent(this.keyboard));
    const playerLapTracker = new LapTrackerComponent();
    playerLapTracker.lastQuadrant = this.getQuadrant(playerTransform.position);
    playerEntity.addComponent(playerLapTracker);
    this.entityManager.addEntity(playerEntity);
    
    // AI Entity
    const aiCarMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
    aiCarMesh.castShadow = true;
    this.scene.add(aiCarMesh);
    const numWaypoints = 32;
    const waypoints: THREE.Vector3[] = [];
    for (let i = 0; i < numWaypoints; i++) {
        const angle = (i / numWaypoints) * 2 * Math.PI;
        waypoints.push(new THREE.Vector3(Math.cos(angle) * config.track.radius, 0, Math.sin(angle) * config.track.radius));
    }
    const aiEntity = new Entity('ai');
    aiEntity.addComponent(new TransformComponent(
        new THREE.Vector3(config.track.radius, 0.25, 2),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
        new THREE.Euler(0, Math.PI, 0)
    ));
    aiEntity.addComponent(new RenderComponent(aiCarMesh));
    aiEntity.addComponent(new PhysicsComponent(0, 0, 0, config.vehicle.wheelBase));
    aiEntity.addComponent(new AIControlComponent(waypoints, 0, 0.08));
    this.entityManager.addEntity(aiEntity);

    const powerUpSpawnPositions = [
      new THREE.Vector3(config.track.radius, 0.5, 0),
      new THREE.Vector3(-config.track.radius, 0.5, 0),
      new THREE.Vector3(0, 0.5, config.track.radius),
      new THREE.Vector3(0, 0.5, -config.track.radius),
    ];
    this.powerUpManager = new PowerUpManager(this.scene, powerUpSpawnPositions);

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
        const playerEntity = this.entityManager.getEntity('player')!;
        const lapTracker = playerEntity.getComponent(LapTrackerComponent)!;
        showRaceOverMenu((Date.now() - this.raceStartTime) / 1000, lapTracker.lap);
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
    const playerEntity = this.entityManager.getEntity('player')!;
    const transform = playerEntity.getComponent(TransformComponent)!;
    const physics = playerEntity.getComponent(PhysicsComponent)!;
    const lapTracker = playerEntity.getComponent(LapTrackerComponent)!;
    
    transform.position.set(config.track.radius, 0.25, 0);
    transform.rotation.y = Math.PI;
    transform.quaternion.setFromEuler(transform.rotation);
    
    physics.speed = 0;
    physics.acceleration = 0;
    physics.steerAngle = 0;

    lapTracker.lap = 0;
    lapTracker.passedHalfway = false;
    lapTracker.lastQuadrant = this.getQuadrant(transform.position);

    this.setState(GameState.MAIN_MENU);
    this.soundManager.stopSound('engine');
    this.soundManager.stopSound('drifting');
  }

  private createTrees() {
    const treeCount = 50;
    const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x006400 }); // Dark green
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Saddle brown

    for (let i = 0; i < treeCount; i++) {
        // Position trees randomly outside the track
        const angle = Math.random() * Math.PI * 2;
        const distance = this.outerRadius + 5 + Math.random() * 20; // 5 to 25 units beyond the outer edge
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        // Simple tree model
        const trunkHeight = 2 + Math.random() * 2;
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, trunkHeight, 8);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, trunkHeight / 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);

        const leavesHeight = 4 + Math.random() * 2;
        const leavesGeometry = new THREE.ConeGeometry(1.5, leavesHeight, 8);
        const leaves = new THREE.Mesh(leavesGeometry, treeMaterial);
        leaves.position.set(x, trunkHeight + leavesHeight / 2, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
    }
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

  private createTireMark(position: THREE.Vector3, rotation: THREE.Euler) {
    const decalSize = new THREE.Vector3(0.5, 2, 0.5);
    const decalRotation = new THREE.Euler(rotation.x - Math.PI / 2, rotation.y, rotation.z);
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

  private handleLapEvents(events: LapSystemEvent[]) {
    for(const event of events) {
        switch(event.type) {
            case 'GAME_STATE_CHANGE':
                this.setState(event.newState);
                if (event.newState === GameState.RACE_OVER) {
                    this.soundManager.playSound('finish-line');
                    this.soundManager.stopSound('engine');
                    this.soundManager.stopSound('drifting');
                }
                break;
            case 'LAP_COMPLETED':
                this.lapStartTime = Date.now();
                const playerEntity = this.entityManager.getEntity('player')!;
                const lapTracker = playerEntity.getComponent(LapTrackerComponent)!;
                if (lapTracker.lap === config.race.laps) {
                    showNotification('Final Lap!');
                }
                break;
            case 'FINAL_LAP':
                 showNotification('Final Lap!');
                 break;
            case 'WRONG_WAY':
                showNotification('Wrong Way!', 2000);
                break;
        }
    }
  }

  private update() {
    const deltaTime = 0; // Not used yet
    const allEntities = this.entityManager.getAllEntities();
    
    // --- Systems ---
    this.inputSystem.update(allEntities, deltaTime);
    this.physicsSystem.update(allEntities, deltaTime);
    this.aiSystem.update(allEntities, deltaTime);

    this.lapSystem.gameState = this.state;
    this.lapSystem.update(allEntities, deltaTime);
    this.handleLapEvents(this.lapSystem.getEvents());

    // Get player entity and components for reuse
    const playerEntity = this.entityManager.getEntity('player')!;
    if (!playerEntity) return;

    const playerTransform = playerEntity.getComponent(TransformComponent)!;
    const playerPhysics = playerEntity.getComponent(PhysicsComponent)!;
    const playerRender = playerEntity.getComponent(RenderComponent)!;

    // --- UI & Minimap ---
    const elapsedTime = (Date.now() - this.raceStartTime) / 1000;
    const currentLapTime = (Date.now() - this.lapStartTime) / 1000;
    updateUI({
      lap: playerEntity.getComponent(LapTrackerComponent)!.lap,
      elapsedTime,
      currentLapTime,
      speed: playerPhysics.speed,
    });
    
    const aiEntity = this.entityManager.getEntity('ai');
    if (aiEntity) {
        const aiTransform = aiEntity.getComponent(TransformComponent)!;
        updateMinimap(playerTransform.position, aiTransform.position, config.track.radius);
    }
    
    // --- Other Game Logic (Collision, Sound, etc.) ---
    const previousPosition = playerTransform.position.clone();

    // Collision Detection (Track boundaries)
    const carRadius = playerTransform.position.length();
    if (carRadius > this.outerRadius || carRadius < this.innerRadius) {
      playerTransform.position.copy(previousPosition);
      playerPhysics.speed *= -config.vehicle.restitution;
      this.cameraShakeIntensity = config.camera.shakeIntensity;
      const collisionSound = Math.random() > 0.5 ? 'collision1' : 'collision2';
      this.soundManager.playSound(collisionSound);
    }

    // Engine sound
    if (playerPhysics.acceleration !== 0 || Math.abs(playerPhysics.speed) > 0.05) {
      this.soundManager.playSound('engine');
    } else {
      this.soundManager.stopSound('engine');
    }

    // Tire marks & drifting sound
    if (playerPhysics.isDrifting) {
      this.createTireMark(
        playerTransform.position.clone().sub(new THREE.Vector3(0, (playerRender.mesh.geometry as THREE.BoxGeometry).parameters.height / 2 - 0.01, 0)),
        playerTransform.rotation
      );
      this.soundManager.playSound('drifting');
    } else {
      this.soundManager.stopSound('drifting');
    }

    // PowerUps
    this.powerUpManager.update(playerEntity);

    // Camera follow
    const cameraOffset = new THREE.Vector3(0, 2, 5);
    const cameraBehind = cameraOffset.clone().applyQuaternion(playerTransform.quaternion);
    this.camera.position.copy(playerTransform.position.clone().add(cameraBehind));
    this.camera.lookAt(playerTransform.position);

    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity *= config.camera.shakeDecay;
    }
    
    // --- Render System ---
    this.renderSystem.update(allEntities, deltaTime);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    switch (this.state) {
        case GameState.MAIN_MENU:
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
            break;
    }

    this.renderer.render(this.scene, this.camera);
  }
} 