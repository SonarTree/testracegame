import * as THREE from 'three';
import { Component } from '../Component';

export class RenderComponent extends Component {
  constructor(public mesh: THREE.Mesh) { super(); }
} 