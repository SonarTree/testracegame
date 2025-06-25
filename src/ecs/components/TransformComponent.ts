import * as THREE from 'three';
import { Component } from '../Component';

export class TransformComponent extends Component {
  constructor(
    public position: THREE.Vector3,
    public quaternion: THREE.Quaternion,
    public rotation: THREE.Euler,
  ) { super(); }
} 