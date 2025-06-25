import { Entity } from './Entity';

export class EntityManager {
  private entities: Map<string, Entity> = new Map();

  public addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public removeEntity(id: string): void {
    this.entities.delete(id);
  }

  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public clear(): void {
    this.entities.clear();
  }
} 