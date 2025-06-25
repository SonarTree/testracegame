import { Entity } from './Entity';

export abstract class System {
  // The update method will be implemented by each specific system.
  // It can optionally return data for the main game loop to process.
  abstract update(entities: Entity[], deltaTime: number): any;
} 