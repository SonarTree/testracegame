import { Component } from './Component';

export class Entity {
  private components: Map<Function, Component> = new Map();

  constructor(public readonly id: string) {}

  public addComponent(component: Component): void {
    this.components.set(component.constructor, component);
  }

  public getComponent<T extends Component>(componentClass: new (...args: any[]) => T): T | undefined {
    return this.components.get(componentClass) as T;
  }

  public hasComponent<T extends Component>(componentClass: new (...args: any[]) => T): boolean {
    return this.components.has(componentClass);
  }
} 