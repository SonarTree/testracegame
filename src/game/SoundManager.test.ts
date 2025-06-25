import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import SoundManager from './SoundManager';

// Mock Three.js components that are instantiated
const mockAudio = {
  play: vi.fn(),
  stop: vi.fn(),
  setBuffer: vi.fn(),
  setLoop: vi.fn(),
  setVolume: vi.fn(),
  isPlaying: false,
};
const mockAudioLoader = {
  load: vi.fn(),
};

vi.mock('three', async (importOriginal) => {
  const actualThree = await importOriginal<typeof THREE>();

  // The AudioListener needs to be a real Object3D to be added to the camera.
  class MockAudioListener extends actualThree.Object3D {
    constructor() {
      super();
    }
  }

  return {
    ...actualThree,
    AudioListener: vi.fn().mockImplementation(() => new MockAudioListener()),
    Audio: vi.fn(() => mockAudio),
    AudioLoader: vi.fn(() => mockAudioLoader),
  };
});

describe('SoundManager', () => {
  let camera: THREE.PerspectiveCamera;
  let soundManager: SoundManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudio.isPlaying = false; // Reset state for isPlaying
    mockAudioLoader.load.mockImplementation(
      (
        _path: string,
        onLoad: (buffer: AudioBuffer) => void,
        _onProgress?: (event: ProgressEvent) => void,
        _onError?: (event: Error | ErrorEvent) => void
      ) => {
        const buffer = {} as AudioBuffer;
        onLoad(buffer);
      }
    );
    camera = new THREE.PerspectiveCamera();
    vi.spyOn(camera, 'add');
    soundManager = new SoundManager(camera);
  });

  it('should be created and attach a listener to the camera', () => {
    expect(THREE.AudioListener).toHaveBeenCalledOnce();
    const listenerInstance = vi.mocked(THREE.AudioListener).mock.results[0].value;
    expect(camera.add).toHaveBeenCalledWith(listenerInstance);
  });

  it('should load a sound successfully', async () => {
    await soundManager.loadSound('test', 'path/to/sound.wav');
    expect(mockAudioLoader.load).toHaveBeenCalledWith(
      'path/to/sound.wav',
      expect.any(Function),
      undefined,
      expect.any(Function)
    );
    expect(mockAudio.setBuffer).toHaveBeenCalled();
  });

  it('should play a sound if it is loaded', async () => {
    await soundManager.loadSound('test', 'path/to/sound.wav');
    soundManager.playSound('test');
    expect(mockAudio.play).toHaveBeenCalledOnce();
  });

  it('should stop a playing sound', async () => {
    await soundManager.loadSound('test', 'path/to/sound.wav');
    mockAudio.isPlaying = true; // Simulate sound is playing
    soundManager.stopSound('test');
    expect(mockAudio.stop).toHaveBeenCalledOnce();
  });

  it('should not play a sound that is not loaded', () => {
    soundManager.playSound('nonexistent');
    expect(mockAudio.play).not.toHaveBeenCalled();
  });

  it('should not play a sound that is already playing', async () => {
    await soundManager.loadSound('test', 'path/to/sound.wav');
    mockAudio.isPlaying = true;
    soundManager.playSound('test');
    expect(mockAudio.play).not.toHaveBeenCalled();
  });

  it('should set the volume of a sound', async () => {
    await soundManager.loadSound('test', 'path/to/sound.wav');
    soundManager.setVolume('test', 0.5);
    expect(mockAudio.setVolume).toHaveBeenCalledWith(0.5);
  });

  it('should stop all playing sounds', async () => {
    // Create a second mock audio object to simulate multiple sounds
    const mockAudio2 = { ...mockAudio, stop: vi.fn(), isPlaying: true };
    await soundManager.loadSound('test1', 'path/to/sound1.wav');
    // Manually insert the second sound into the manager's internal map
    // @ts-expect-error - testing private property
    soundManager.sounds.set('test2', mockAudio2 as unknown as THREE.Audio);

    mockAudio.isPlaying = true;
    soundManager.stopAllSounds();

    expect(mockAudio.stop).toHaveBeenCalledOnce();
    expect(mockAudio2.stop).toHaveBeenCalledOnce();
  });

  it('should load all game sounds', async () => {
    // To test this, we need to spy on the instance method `loadSound`
    const loadSoundSpy = vi.spyOn(soundManager, 'loadSound');
    await soundManager.loadSounds();
    expect(loadSoundSpy).toHaveBeenCalledWith('engine', '/audio/engine.wav', true);
    expect(loadSoundSpy).toHaveBeenCalledWith('drifting', '/audio/drifting.wav', true);
    expect(loadSoundSpy).toHaveBeenCalledWith('collision 1', '/audio/collision 1.wav');
    expect(loadSoundSpy).toHaveBeenCalledWith('collision 2', '/audio/collision 2.wav');
    expect(loadSoundSpy).toHaveBeenCalledWith('finishline', '/audio/finishline.wav');
    expect(loadSoundSpy).toHaveBeenCalledTimes(5);
  });

  it('should handle errors during sound loading', async () => {
    const error = new Error('Loading failed');
    mockAudioLoader.load.mockImplementationOnce(
      (
        _path: string,
        _onLoad: (buffer: AudioBuffer) => void,
        _onProgress?: (event: ProgressEvent) => void,
        onError?: (event: Error | ErrorEvent) => void
      ) => {
        if (onError) {
          onError(error);
        }
      }
    );

    await expect(soundManager.loadSound('fail', 'fail/path')).rejects.toThrow('Loading failed');
  });
}); 