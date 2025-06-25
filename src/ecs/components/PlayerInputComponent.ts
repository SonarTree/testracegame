import { Component } from '../Component';

export class PlayerInputComponent extends Component {
  constructor(public keyboard: { [key: string]: boolean }) { super(); }
} 