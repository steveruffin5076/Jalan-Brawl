import { audioSettings } from '../systems/AudioSettings.js';
import Phaser from 'phaser';

const NEXT_SCENE = 'Preload';
const BASE = 'assets/besi_splash/';
const FRAMES = 36;
const FPS = 12;
const HOLD_MS = 600;
const FADE_MS = 400;

/** Besi Works studio splash (170×96 forge). Tap to start sound on web, then Preload. */
export default class BesiSplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BesiSplash' });
  }

  preload() {
    this.load.spritesheet('besiSplash', `${BASE}besi_splash_sheet.png`, {
      frameWidth: 170,
      frameHeight: 96
    });
    this.load.spritesheet('besiSplashPortrait', `${BASE}besi_splash_sheet_portrait.png`, {
      frameWidth: 96,
      frameHeight: 170
    });
    this.load.audio('besiSplashSfx', [`${BASE}besi_splash.ogg`, `${BASE}besi_splash.mp3`]);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0c080a');
    this.leaving = false;
    this.started = false;

    const { width, height } = this.scale;
    const portrait = height > width;
    const key = portrait ? 'besiSplashPortrait' : 'besiSplash';
    const fw = portrait ? 96 : 170;
    const fh = portrait ? 170 : 96;
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    const scale = Math.min(width / fw, height / fh);
    this.sprite = this.add.sprite(width / 2, height / 2, key, 0).setScale(scale);
    this.animKey = `${key}Anim`;
    this.sprite.setVisible(false);

    if (!this.anims.exists(this.animKey)) {
      this.anims.create({
        key: this.animKey,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: FRAMES - 1 }),
        frameRate: FPS,
        repeat: 0
      });
    }

    if (this.sound.locked) {
      const label = this.add.text(width / 2, height / 2, 'TAP TO START', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#f49c38'
      }).setOrigin(0.5);
      const begin = () => {
        if (!label.active) return;
        label.destroy();
        this.play();
      };
      this.input.once('pointerdown', begin);
      this.input.keyboard?.once('keydown', begin);
    } else {
      this.play();
    }
  }

  play() {
    if (this.started) return;
    this.started = true;
    this.sprite.setVisible(true);
    this.sfx = this.sound.add('besiSplashSfx', { volume: audioSettings.values.effects });
    this.sfx.play();
    this.sprite.play(this.animKey);
    this.sprite.once('animationcomplete', () => {
      this.time.delayedCall(HOLD_MS, () => this.finish());
    });
    this.time.delayedCall(100, () => {
      this.input.once('pointerdown', () => this.finish());
      this.input.keyboard?.once('keydown', () => this.finish());
    });
  }

  finish() {
    if (this.leaving) return;
    this.leaving = true;
    if (this.sfx) {
      this.tweens.add({ targets: this.sfx, volume: 0, duration: FADE_MS });
    }
    this.cameras.main.fadeOut(FADE_MS, 12, 8, 10);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.sfx) this.sfx.stop();
      this.scene.start(NEXT_SCENE);
    });
  }
}
