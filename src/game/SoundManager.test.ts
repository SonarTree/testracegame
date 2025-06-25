import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import SoundManager from './SoundManager';

// Mock Three.js components that are instantiated
const mockAudioListener = { add: vi.fn() };
const mockAudio = {
  play: vi.fn(),
  stop: vi.fn(),
  setBuffer: vi.fn(),
  setLoop: vi.fn(),
  setVolume: vi.fn(),
  isPlaying: false,
};
const mockAudioLoader = {
  load: vi.fn((_path, onLoad) => {
    const buffer = {} as AudioBuffer;
    onLoad(buffer);
  }),
};

vi.mock('three', async () => {
  const actualThree = await vi.importActual('three');
  return {
    ...actualThree,
    AudioListener: vi.fn(() => mockAudioListener),
    Audio: vi.fn(() => mockAudio),
    AudioLoader: vi.fn(() => mockAudioLoader),
  };
});

describe('SoundManager', () => {
  let camera: THREE.PerspectiveCamera;
  let soundManager: SoundManager;

  beforeEach(() => {
    vi.clearAllMocks();
    camera = new THREE.PerspectiveCamera();
    vi.spyOn(camera, 'add'); // Spy on the actual camera instance's add method
    soundManager = new SoundManager(camera);
  });

  it('should be created and attach a listener to the camera', () => {
    expect(THREE.AudioListener).toHaveBeenCalledOnce();
    expect(camera.add).toHaveBeenCalledWith(mockAudioListener);
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
}); 