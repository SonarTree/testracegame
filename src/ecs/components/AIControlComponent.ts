import * as THREE from 'three';
import { Component } from '../Component';

export class AIControlComponent extends Component {
    constructor(
        public waypoints: THREE.Vector3[],
        public currentWaypointIndex: number = 0,
        public speed: number,
    ) { super(); }
} 