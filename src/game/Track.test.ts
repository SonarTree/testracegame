import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createTrack } from './Track';
import { config } from '../config';

// Mock the scene's add method and TextureLoader
vi.mock('three', async () => {
    const originalThree = await vi.importActual<typeof THREE>('three');
    return {
        ...originalThree,
        TextureLoader: vi.fn().mockImplementation(() => ({
            load: vi.fn().mockReturnValue(new originalThree.Texture()),
        })),
    };
});

const mockScene = {
  add: vi.fn(),
};

describe('Track Module', () => {
  beforeEach(() => {
    mockScene.add.mockClear();
  });

  it('should create all track elements and return them', () => {
    const trackPieces = createTrack(mockScene as any);

    expect(trackPieces).toHaveProperty('ground');
    expect(trackPieces).toHaveProperty('road');
    expect(trackPieces).toHaveProperty('outerWall');
    expect(trackPieces).toHaveProperty('innerWall');
    expect(trackPieces).toHaveProperty('finishLine');
    expect(trackPieces).not.toHaveProperty('finishLinePlane');
    expect(trackPieces).toHaveProperty('outerRadius');
    expect(trackPieces).toHaveProperty('innerRadius');
    
    expect(trackPieces.road).toBeInstanceOf(THREE.Mesh);
    expect(trackPieces.outerWall).toBeInstanceOf(THREE.Mesh);
    expect(trackPieces.innerWall).toBeInstanceOf(THREE.Mesh);

    // Ground, Road, Outer Wall, Inner Wall, Finish Line
    expect(mockScene.add).toHaveBeenCalledTimes(5);
  });
}); 