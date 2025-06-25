import { describe, it, expect } from 'vitest';
import { config } from './config';

describe('Config Module', () => {
  it('should export a configuration object', () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('should have a vehicle configuration section', () => {
    expect(config).toHaveProperty('vehicle');
    expect(typeof config.vehicle).toBe('object');
    expect(config.vehicle).toHaveProperty('enginePower');
    expect(config.vehicle).toHaveProperty('friction');
  });

  it('should have a camera configuration section', () => {
    expect(config).toHaveProperty('camera');
    expect(typeof config.camera).toBe('object');
    expect(config.camera).toHaveProperty('shakeIntensity');
  });
}); 