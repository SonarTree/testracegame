import { Component } from '../Component';

export class PhysicsComponent extends Component {
    constructor(
        public speed: number = 0,
        public acceleration: number = 0,
        public steerAngle: number = 0,
        public wheelBase: number,
        public isDrifting: boolean = false,
    ) { super(); }
} 