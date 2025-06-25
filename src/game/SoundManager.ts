import * as THREE from 'three';

class SoundManager {
  private sounds: Map<string, THREE.Audio> = new Map();
  private listener: THREE.AudioListener;

  constructor(camera: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
  }

  public async loadSound(name: string, path: string, loop = false) {
    return new Promise<void>((resolve, reject) => {
      const sound = new THREE.Audio(this.listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(
        path,
        (buffer) => {
          sound.setBuffer(buffer);
          sound.setLoop(loop);
          sound.setVolume(0.5);
          this.sounds.set(name, sound);
          resolve();
        },
        undefined, // onProgress callback
        (error) => {
          console.error(`Error loading sound: ${name}`, error);
          reject(error);
        }
      );
    });
  }

  public playSound(name: string) {
    const sound = this.sounds.get(name);
    if (sound && !sound.isPlaying) {
      sound.play();
    }
  }

  public stopSound(name: string) {
    const sound = this.sounds.get(name);
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  public setVolume(name: string, volume: number) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.setVolume(volume);
    }
  }

  public stopAllSounds() {
    this.sounds.forEach((sound) => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
  }

  public async loadSounds() {
    await this.loadSound('engine', '/audio/engine.wav', true);
    await this.loadSound('drifting', '/audio/drifting.wav', true);
    await this.loadSound('collision 1', '/audio/collision 1.wav');
    await this.loadSound('collision 2', '/audio/collision 2.wav');
    await this.loadSound('finishline', '/audio/finishline.wav');
  }
}

export default SoundManager; 