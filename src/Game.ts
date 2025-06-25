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
  showMapSelectionMenu,
  populateMapList,
  startRaceButton,
  backToMainMenuButton,
} from './ui/GameUI';
import { createTrack } from './game/Track';
import { maps } from './game/maps';
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
import { CollisionSystem, CollisionEvent } from './ecs/systems/CollisionSystem';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  public state: GameState;
  private soundManager: SoundManager;
  private selectedMapId: string | null = null;

  // ECS
  private entityManager: EntityManager;
  private inputSystem: InputSystem;
  private physicsSystem: PhysicsSystem;
  private aiSystem: AISystem;
  private lapSystem: LapSystem;
  private renderSystem: RenderSystem;
  private collisionSystem!: CollisionSystem;

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

  private roadMeshes: THREE.Object3D[] = [];

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
    const loader = new THREE.CubeTextureLoader();
    loader.setPath('/textures/skybox/');
    this.scene.background = loader.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 50, 20);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('app')?.appendChild(this.renderer.domElement);

    try {
      await this.soundManager.loadSounds();
    } catch (error) {
      console.error("Could not load sounds. The game will continue without audio.", error);
    }

    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('keydown', (event) => { this.keyboard[event.key.toLowerCase()] = true; });
    document.addEventListener('keyup', (event) => { this.keyboard[event.key.toLowerCase()] = false; });

    startButton?.addEventListener('click', () => this.setState(GameState.MAP_SELECTION));
    restartButton?.addEventListener('click', () => this.returnToMenu());

    backToMainMenuButton?.addEventListener('click', () => this.setState(GameState.MAIN_MENU));

    startRaceButton?.addEventListener('click', () => {
        if (this.selectedMapId) {
            this.startRace();
        } else {
            showNotification('Please select a map first!', 2000);
        }
    });
    
    const mapList = document.getElementById('map-list');
    mapList?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'LI' && target.dataset.mapId) {
            this.selectedMapId = target.dataset.mapId;
        }
    });
    
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
      case GameState.MAP_SELECTION:
        this.selectedMapId = null;
        showMapSelectionMenu();
        populateMapList(maps);
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

  private startRace() {
    if (!this.selectedMapId) return;
    const selectedMap = maps.find(m => m.id === this.selectedMapId);
    if (!selectedMap) return;

    this.entityManager.getAllEntities().forEach(entity => {
      const renderComponent = entity.getComponent(RenderComponent);
      if (renderComponent) this.scene.remove(renderComponent.mesh);
    });
    this.entityManager.clear();

    this.roadMeshes.forEach(mesh => this.scene.remove(mesh));
    this.roadMeshes = [];

    this.tireMarks.forEach(mark => this.scene.remove(mark));
    this.tireMarks = [];
    
    if (this.powerUpManager) {
        this.powerUpManager.stop();
        this.powerUpManager.clearPowerUps();
    }

    const { road, innerWall, outerWall, ground, finishLine } = createTrack(this.scene, selectedMap.trackConfig);
    this.road = road;
    this.innerRadius = selectedMap.trackConfig.radius - selectedMap.trackConfig.width / 2;
    this.outerRadius = selectedMap.trackConfig.radius + selectedMap.trackConfig.width / 2;
    this.roadMeshes.push(road, innerWall, outerWall, ground, finishLine);

    this.collisionSystem = new CollisionSystem(this.innerRadius, this.outerRadius);
    this.createTrees();

    const playerCarMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
    playerCarMesh.castShadow = true;
    this.scene.add(playerCarMesh);
    const playerEntity = new Entity('player');
    const playerTransform = new TransformComponent(new THREE.Vector3(selectedMap.trackConfig.radius, 0.25, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), new THREE.Euler(0, Math.PI, 0));
    playerEntity.addComponent(playerTransform);
    playerEntity.addComponent(new RenderComponent(playerCarMesh));
    playerEntity.addComponent(new PhysicsComponent(0,0,0,config.vehicle.wheelBase));
    playerEntity.addComponent(new PlayerInputComponent(this.keyboard));
    const playerLapTracker = new LapTrackerComponent();
    playerLapTracker.lastQuadrant = this.getQuadrant(playerTransform.position);
    playerEntity.addComponent(playerLapTracker);
    this.entityManager.addEntity(playerEntity);
    
    const aiCarMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
    aiCarMesh.castShadow = true;
    this.scene.add(aiCarMesh);
    const waypoints = Array.from({ length: 32 }, (_, i) => {
      const angle = (i / 32) * 2 * Math.PI;
      return new THREE.Vector3(Math.cos(angle) * selectedMap.trackConfig.radius, 0, Math.sin(angle) * selectedMap.trackConfig.radius);
    });
    const aiEntity = new Entity('ai');
    aiEntity.addComponent(new TransformComponent(new THREE.Vector3(selectedMap.trackConfig.radius, 0.25, 2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), new THREE.Euler(0, Math.PI, 0)));
    aiEntity.addComponent(new RenderComponent(aiCarMesh));
    aiEntity.addComponent(new PhysicsComponent(0,0,0,config.vehicle.wheelBase));
    aiEntity.addComponent(new AIControlComponent(waypoints, 0, 0.08));
    const aiLapTracker = new LapTrackerComponent();
    aiLapTracker.lastQuadrant = this.getQuadrant(aiEntity.getComponent(TransformComponent)!.position);
    aiEntity.addComponent(aiLapTracker);
    this.entityManager.addEntity(aiEntity);

    const powerUpSpawnPositions = [
      new THREE.Vector3(selectedMap.trackConfig.radius, 0.5, 0),
      new THREE.Vector3(-selectedMap.trackConfig.radius, 0.5, 0),
      new THREE.Vector3(0, 0.5, selectedMap.trackConfig.radius),
      new THREE.Vector3(0, 0.5, -selectedMap.trackConfig.radius),
    ];
    this.powerUpManager = new PowerUpManager(this.scene, powerUpSpawnPositions);
    
    this.setState(GameState.PLAYING);
    this.raceStartTime = Date.now();
    this.lapStartTime = Date.now();
    this.powerUpManager.start();
  }
  
  public returnToMenu() {
    this.soundManager.stopAllSounds();
    this.setState(GameState.MAIN_MENU);
  }

  private createTrees() {
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = this.outerRadius + 5 + Math.random() * 20;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        const tree = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), new THREE.MeshPhongMaterial({ color: 0x228B22 }));
        tree.position.set(x, 2.5, z);
        tree.castShadow = true;
        this.scene.add(tree);
        this.roadMeshes.push(tree);
    }
  }

  private getQuadrant(position: THREE.Vector3) {
    if (position.x > 0 && position.z > 0) return 1;
    if (position.x < 0 && position.z > 0) return 2;
    if (position.x < 0 && position.z < 0) return 3;
    if (position.x > 0 && position.z < 0) return 4;
    return 0;
  }

  private createTireMark(position: THREE.Vector3, rotation: THREE.Euler) {
    const decal = new THREE.Mesh(new DecalGeometry(this.road, position, rotation, new THREE.Vector3(0.5, 1, 1)), this.tireMarkMaterial);
    this.scene.add(decal);
    this.tireMarks.push(decal);
    if (this.tireMarks.length > 100) {
      const oldestMark = this.tireMarks.shift();
      if (oldestMark) {
        this.scene.remove(oldestMark);
        oldestMark.geometry.dispose();
      }
    }
  }

  private handleLapEvents(events: LapSystemEvent[]) {
    for (const event of events) {
        switch(event.type) {
            case 'GAME_STATE_CHANGE':
                this.setState(event.newState);
                break;
            case 'LAP_COMPLETED': {
                const playerEntity = this.entityManager.getEntity('player')!;
                const lapTracker = playerEntity.getComponent(LapTrackerComponent)!;
                showNotification(`Lap ${lapTracker.lap} / ${config.race.laps}`);
                this.lapStartTime = Date.now();
                this.soundManager.playSound('finishline');
                break;
            }
            case 'FINAL_LAP':
                showNotification('Final Lap!');
                break;
            case 'WRONG_WAY':
                showNotification('Wrong Way!', 2000);
                break;
            case 'RACE_FINISHED':
                this.soundManager.playSound('finishline');
                this.setState(GameState.RACE_OVER);
                break;
        }
    }
  }

  private handleCollisionEvents(events: CollisionEvent[]) {
    for (const event of events) {
      if (event.type === 'TRACK_COLLISION') {
        this.soundManager.playSound('collision 1');
        this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, event.shakeIntensity);
      }
    }
  }

  private update() {
    const delta = 0.016;
    const allEntities = this.entityManager.getAllEntities();

    if (this.state === GameState.PLAYING) {
      this.inputSystem.update(allEntities, delta);
      this.physicsSystem.update(allEntities, delta);
      this.aiSystem.update(allEntities, delta);

      this.lapSystem.gameState = this.state;
      this.lapSystem.update(allEntities, delta);
      this.handleLapEvents(this.lapSystem.getEvents());

      this.collisionSystem.update(allEntities, delta);
      this.handleCollisionEvents(this.collisionSystem.getEvents());
      
      const playerEntity = this.entityManager.getEntity('player');
      if (playerEntity) {
        const playerTransform = playerEntity.getComponent(TransformComponent)!;
        const playerPhysics = playerEntity.getComponent(PhysicsComponent)!;
        const playerLapTracker = playerEntity.getComponent(LapTrackerComponent)!;
        const aiEntity = this.entityManager.getEntity('ai');
        const aiTransform = aiEntity?.getComponent(TransformComponent)!;

        updateUI({
            lap: playerLapTracker.lap,
            elapsedTime: (Date.now() - this.raceStartTime) / 1000,
            currentLapTime: (Date.now() - this.lapStartTime) / 1000,
            speed: playerPhysics.speed,
        });

        if(aiTransform) updateMinimap(playerTransform.position, aiTransform.position, this.outerRadius);

        this.powerUpManager.update(playerEntity);
        if (playerPhysics.isDrifting) {
            this.soundManager.playSound('drifting');
            const tireMarkRotation = playerTransform.rotation.clone();
            tireMarkRotation.y += Math.PI / 2;
            this.createTireMark(playerTransform.position.clone().setY(0.02), tireMarkRotation);
        } else {
            this.soundManager.stopSound('drifting');
        }
        const engineVolume = Math.min(1.0, Math.max(0.1, Math.abs(playerPhysics.speed) / 0.2));
        this.soundManager.setVolume('engine', engineVolume);
        this.soundManager.playSound('engine');
      }
    } else {
      this.soundManager.stopAllSounds();
    }
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    const delta = 0.016;
    
    if (this.state === GameState.PLAYING) {
      this.update();
    }
    
    this.renderSystem.update(this.entityManager.getAllEntities(), delta);

    const playerEntity = this.entityManager.getEntity('player');
    if (this.state === GameState.PLAYING && playerEntity) {
        const playerTransform = playerEntity.getComponent(TransformComponent)!;
        const cameraOffset = new THREE.Vector3(0, 2, 5);
        const cameraBehind = cameraOffset.clone().applyQuaternion(playerTransform.quaternion);
        this.camera.position.copy(playerTransform.position.clone().add(cameraBehind));
        this.camera.lookAt(playerTransform.position);

        if (this.cameraShakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.cameraShakeIntensity *= config.camera.shakeDecay;
            if (this.cameraShakeIntensity < 0.01) this.cameraShakeIntensity = 0;
        }
    } else if (this.state === GameState.MAIN_MENU) {
        const time = Date.now() * 0.0002;
        this.camera.position.x = Math.sin(time) * 20;
        this.camera.position.z = Math.cos(time) * 20;
        this.camera.position.y = 10;
        this.camera.lookAt(0, 0, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }
} 