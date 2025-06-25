import * as THREE from 'three';
import { TrackConfig } from './maps';

export function createTrack(scene: THREE.Scene, trackConfig: TrackConfig) {
    const { radius, width, wallSegments, wallHeight, wallTubeRadius } = trackConfig;
    const innerRadius = radius - width / 2;
    const outerRadius = radius + width / 2;

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x404040, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Road
    const roadGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);
    const roadMaterial = new THREE.MeshPhongMaterial({ color: 0x303030, side: THREE.DoubleSide });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    scene.add(road);

    // Walls (as smooth curbs)
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xa0a0a0 });

    const createWall = (ringRadius: number) => {
        const wallGeometry = new THREE.TorusGeometry(ringRadius, wallTubeRadius, 16, wallSegments);
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.rotation.x = Math.PI / 2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        return wall;
    };
    
    const outerWall = createWall(outerRadius);
    const innerWall = createWall(innerRadius);

    // Start/Finish Line
    const finishLine = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 5),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/checker.png') })
    );
    finishLine.position.set(radius, 0.02, 0);
    finishLine.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    scene.add(finishLine);
    
    return { ground, road, outerWall, innerWall, outerRadius, innerRadius, finishLine };
} 