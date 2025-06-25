import { System } from '../System';
import { Entity } from '../Entity';
import { TransformComponent } from '../components/TransformComponent';
import { LapTrackerComponent } from '../components/LapTrackerComponent';
import { config } from '../../config';
import * as THREE from 'three';
import { GameState } from '../../game/GameState';

export type LapSystemEvent =
  | { type: 'GAME_STATE_CHANGE'; newState: GameState }
  | { type: 'LAP_COMPLETED' }
  | { type: 'FINAL_LAP' }
  | { type: 'WRONG_WAY' };

export class LapSystem extends System {
    public gameState!: GameState;
    private events: LapSystemEvent[] = [];

    private getQuadrant(position: THREE.Vector3): number {
        if (position.x >= 0 && position.z > 0) return 1;
        if (position.x < 0 && position.z >= 0) return 2;
        if (position.x <= 0 && position.z < 0) return 3;
        if (position.x > 0 && position.z <= 0) return 4;
        return 0;
    }

    public getEvents(): LapSystemEvent[] {
        const e = this.events;
        this.events = []; // Clear after getting
        return e;
    }

    public update(entities: Entity[], deltaTime: number): void {
        for (const entity of entities) {
            if (entity.hasComponent(TransformComponent) && entity.hasComponent(LapTrackerComponent)) {
                const transform = entity.getComponent(TransformComponent)!;
                const lapTracker = entity.getComponent(LapTrackerComponent)!;
                const lastQuadrant = lapTracker.lastQuadrant;

                const currentQuadrant = this.getQuadrant(transform.position);

                if (currentQuadrant !== lastQuadrant) {
                    const isForward = currentQuadrant === (lastQuadrant % 4) + 1;
                    const isBackward = lastQuadrant === (currentQuadrant % 4) + 1;

                    if (isBackward) {
                        lapTracker.passedHalfway = false;
                        if (this.gameState === GameState.PLAYING && !lapTracker.isGoingWrongWay) {
                            this.events.push({ type: 'WRONG_WAY' });
                            lapTracker.isGoingWrongWay = true;
                        }
                    } else if (isForward) {
                        lapTracker.isGoingWrongWay = false;
                    }

                    if (currentQuadrant === 1 && lastQuadrant === 4) { // Crossed finish line
                        if (lapTracker.passedHalfway) {
                            if (lapTracker.lap === config.race.laps) {
                                this.events.push({ type: 'GAME_STATE_CHANGE', newState: GameState.RACE_OVER });
                                continue; 
                            }

                            lapTracker.lap++;
                            this.events.push({ type: 'LAP_COMPLETED' });
                            lapTracker.passedHalfway = false;

                            if (lapTracker.lap === config.race.laps) {
                                this.events.push({ type: 'FINAL_LAP' });
                            }
                        }
                    } else if (currentQuadrant === 3 && lastQuadrant === 2) {
                        lapTracker.passedHalfway = true;
                    }
                    lapTracker.lastQuadrant = currentQuadrant;
                }
            }
        }
    }
} 