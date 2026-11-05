/** Scene-owned background loops: stop on exit and pause with gameplay. */
export default class SceneAudio {
  constructor(scene) {
    this.sound = scene.sound;
    this.music = null;
    this.ambience = null;
    this.musicKey = null;
    scene.events.on('pause', this.pause, this);
    scene.events.on('resume', this.resume, this);
    scene.events.once('shutdown', () => {
      scene.events.off('pause', this.pause, this);
      scene.events.off('resume', this.resume, this);
      this.dispose();
    });
  }

  setMusic(key) {
    if (this.musicKey === key) return;
    this.destroySound(this.music);
    this.musicKey = key;
    this.music = this.sound.add(key, { loop: true, volume: 0.25 });
    this.music.play();
  }

  startAmbience() {
    if (this.ambience) return;
    this.ambience = this.sound.add('streetAmbience', { loop: true, volume: 0.65 });
    this.ambience.play();
  }

  pause() {
    for (const sound of [this.music, this.ambience]) if (sound && sound.isPlaying) sound.pause();
  }

  resume() {
    for (const sound of [this.music, this.ambience]) if (sound && sound.isPaused) sound.resume();
  }

  dispose() {
    this.destroySound(this.music);
    this.destroySound(this.ambience);
    this.music = null;
    this.ambience = null;
    this.musicKey = null;
  }

  destroySound(sound) {
    if (!sound) return;
    sound.stop();
    sound.destroy();
  }
}
