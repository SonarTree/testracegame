import { System } from '../System';
import { Entity } from '../Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { config } from '../../config';

export type CollisionEvent = {
    type: 'TRACK_COLLISION'
};

export class CollisionSystem extends System {
  public cameraShakeIntensity = 0;
  private events: CollisionEvent[] = [];

  constructor(private innerRadius: number, private outerRadius: number) {
    super();
  }
  
  public getEvents(): CollisionEvent[] {
    const e = this.events;
    this.events = []; // Clear after getting
    return e;
  }

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      if (entity.hasComponent(TransformComponent) && entity.hasComponent(PhysicsComponent)) {
        const transform = entity.getComponent(TransformComponent)!;
        const physics = entity.getComponent(PhysicsComponent)!;
        const previousPosition = transform.position.clone();

        const carRadius = transform.position.length();
        if (carRadius > this.outerRadius || carRadius < this.innerRadius) {
          transform.position.copy(previousPosition);
          physics.speed *= -config.vehicle.restitution;
          this.cameraShakeIntensity = config.camera.shakeIntensity;
          this.events.push({ type: 'TRACK_COLLISION' });
        }
      }
    }
  }
} 