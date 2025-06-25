import * as THREE from 'three';

export function createTrack(scene: THREE.Scene) {
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

    return { ground, walls, finishLine, finishLinePlane };
} 