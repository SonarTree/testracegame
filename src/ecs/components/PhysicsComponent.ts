import { Component } from '../Component';

export class PhysicsComponent extends Component {
    constructor(
        public speed: number = 0,
        public acceleration: number = 0,
        public steerAngle: number = 0,
        public wheelBase: number,
        public isDrifting: boolean = false,
        public steering = 0,
        public drift = 0,
        public driftAngle = 0,
        public isColliding = false,
        public mass: number = 1
    ) { super(); }
} 