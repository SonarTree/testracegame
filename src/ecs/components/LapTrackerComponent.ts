import { Component } from '../Component';

export class LapTrackerComponent extends Component {
    constructor(
        public lap: number = 0,
        public passedHalfway: boolean = false,
        public lastQuadrant: number = 0,
        public isGoingWrongWay: boolean = false,
    ) { super(); }
} 