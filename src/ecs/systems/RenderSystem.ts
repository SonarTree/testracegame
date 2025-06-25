import { System } from '../System';
import { Entity } from '../Entity';
import { TransformComponent } from '../components/TransformComponent';
import { RenderComponent } from '../components/RenderComponent';

export class RenderSystem extends System {
  public update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      if (entity.hasComponent(TransformComponent) && entity.hasComponent(RenderComponent)) {
        const transform = entity.getComponent(TransformComponent)!;
        const render = entity.getComponent(RenderComponent)!;
        
        render.mesh.position.copy(transform.position);
        render.mesh.quaternion.copy(transform.quaternion);
      }
    }
  }
} 