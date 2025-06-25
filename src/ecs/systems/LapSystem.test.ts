import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Entity } from '../Entity';
import { LapSystem } from './LapSystem';
import { TransformComponent } from '../components/TransformComponent';
import { LapTrackerComponent } from '../components/LapTrackerComponent';
import { GameState } from '../../game/GameState';
import { config } from '../../config';

describe('LapSystem', () => {
  let lapSystem: LapSystem;
  let entity: Entity;
  let transform: TransformComponent;
  let lapTracker: LapTrackerComponent;

  beforeEach(() => {
    lapSystem = new LapSystem();
    entity = new Entity('player');
    transform = new TransformComponent(new THREE.Vector3(), new THREE.Quaternion(), new THREE.Euler());
    lapTracker = new LapTrackerComponent();
    entity.addComponent(transform);
    entity.addComponent(lapTracker);
    lapSystem.gameState = GameState.PLAYING;
  });

  function setQuadrant(quadrant: number) {
    switch (quadrant) {
      case 1: transform.position.set(1, 0, 1); break;
      case 2: transform.position.set(-1, 0, 1); break;
      case 3: transform.position.set(-1, 0, -1); break;
      case 4: transform.position.set(1, 0, -1); break;
    }
    lapSystem.update([entity], 0);
  }

  it('should not count a lap if passedHalfway is false', () => {
    lapTracker.lastQuadrant = 4;
    lapTracker.passedHalfway = false;
    
    setQuadrant(1); // Cross finish line

    const events = lapSystem.getEvents();
    expect(lapTracker.lap).toBe(0);
    expect(events.some(e => e.type === 'LAP_COMPLETED')).toBe(false);
  });

  it('should count a lap if passedHalfway is true', () => {
    lapTracker.lastQuadrant = 4;
    lapTracker.passedHalfway = true;
    
    setQuadrant(1); // Cross finish line

    const events = lapSystem.getEvents();
    expect(lapTracker.lap).toBe(1);
    expect(events.some(e => e.type === 'LAP_COMPLETED')).toBe(true);
    expect(lapTracker.passedHalfway).toBe(false); // Should reset after lap
  });

  it('should set passedHalfway to false when moving backward over the halfway point', () => {
    lapTracker.lastQuadrant = 3;
    lapTracker.passedHalfway = true;
    
    setQuadrant(2); // Move backward from Q3 to Q2

    expect(lapTracker.passedHalfway).toBe(false);
  });
  
  it('should trigger a "Wrong Way!" event when moving backward', () => {
    lapTracker.lastQuadrant = 3;
    setQuadrant(2); // Move backward

    const events = lapSystem.getEvents();
    expect(events.some(e => e.type === 'WRONG_WAY')).toBe(true);
    expect(lapTracker.isGoingWrongWay).toBe(true);
  });

  it('should not trigger a "Wrong Way!" event when moving forward', () => {
    lapTracker.lastQuadrant = 1;
    setQuadrant(2); // Move forward

    const events = lapSystem.getEvents();
    expect(events.some(e => e.type === 'WRONG_WAY')).toBe(false);
    expect(lapTracker.isGoingWrongWay).toBe(false);
  });
}); 