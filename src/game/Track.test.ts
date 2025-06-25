import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { createTrack } from './Track';

// Mock the scene's add method and TextureLoader
vi.mock('three', async () => {
    const originalThree = await vi.importActual<typeof THREE>('three');
    return {
        ...originalThree,
        TextureLoader: vi.fn().mockImplementation(() => ({
            load: vi.fn(),
        })),
    };
});

const mockScene = {
  add: vi.fn(),
};

describe('Track Module', () => {
  it('should create all track elements and return them', () => {
    const trackPieces = createTrack(mockScene as any);

    // Check that the function returns an object with the correct keys
    expect(trackPieces).toHaveProperty('ground');
    expect(trackPieces).toHaveProperty('walls');
    expect(trackPieces).toHaveProperty('finishLine');
    expect(trackPieces).toHaveProperty('finishLinePlane');

    // Check that the returned objects are of the correct type
    expect(trackPieces.ground).toBeInstanceOf(THREE.Mesh);
    expect(Array.isArray(trackPieces.walls)).toBe(true);
    expect(trackPieces.walls.length).toBe(4);
    expect(trackPieces.finishLine).toBeInstanceOf(THREE.Mesh);
    expect(trackPieces.finishLinePlane).toBeInstanceOf(THREE.Plane);

    // Check that all the meshes were added to the scene
    // Ground (1) + Walls (4) + Finish Line (1) = 6
    expect(mockScene.add).toHaveBeenCalledTimes(6);
  });
}); 