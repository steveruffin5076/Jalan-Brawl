// Besi Works Studio splash screen for Phaser 3 (also works in Phaser 4).
// Plays the pixel-art sprite sheet with sound, then starts the next scene.
// Skippable with any key, click or tap.
//
// Usage:
//   import SplashScene from './SplashScene.js';
//   new Phaser.Game({ ..., pixelArt: true, scene: [SplashScene, MainMenuScene] });
//   SplashScene starts the scene with key 'MainMenu' (change NEXT_SCENE below).

const NEXT_SCENE = 'MainMenu';
const BASE = 'assets/besi_splash/'; // folder that holds the splash files
const FRAMES = 36;
const FPS = 12;
const HOLD_MS = 600;
const FADE_MS = 400;

export default class SplashScene extends Phaser.Scene {
  constructor() {
    super('BesiSplash');
  }

  preload() {
    this.load.spritesheet('besiSplash', BASE + 'besi_splash_sheet.png', {
      frameWidth: 160,
      frameHeight: 90,
    });
    this.load.spritesheet('besiSplashPortrait', BASE + 'besi_splash_sheet_portrait.png', {
      frameWidth: 90,
      frameHeight: 160,
    });
    this.load.audio('besiSplashSfx', [BASE + 'besi_splash.ogg', BASE + 'besi_splash.mp3']);
  }

  create() {
    this.cameras.main.setBackgroundColor('#16101a');
    this.leaving = false;
    this.started = false;

    const { width, height } = this.scale;
    // Portrait screen (phone held upright) uses the 90x160 sheet.
    const portrait = height > width;
    const key = portrait ? 'besiSplashPortrait' : 'besiSplash';
    const fw = portrait ? 90 : 160;
    const fh = portrait ? 160 : 90;
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    const scale = Math.max(1, Math.floor(Math.min(width / fw, height / fh)));
    this.sprite = this.add.sprite(width / 2, height / 2, key, 0).setScale(scale);
    this.animKey = key + 'Anim';
    this.sprite.setVisible(false);

    if (!this.anims.exists(this.animKey)) {
      this.anims.create({
        key: this.animKey,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: FRAMES - 1 }),
        frameRate: FPS,
        repeat: 0,
      });
    }

    // Browsers block sound until the first tap, so show "TAP TO START" when locked.
    if (this.sound.locked) {
      const label = this.add
        .text(width / 2, height / 2, 'TAP TO START', { fontFamily: 'monospace', fontSize: '24px', color: '#f49c38' })
        .setOrigin(0.5);
      this.input.once('pointerdown', () => {
        label.destroy();
        this.play();
      });
      this.input.keyboard?.once('keydown', () => {
        if (label.active) {
          label.destroy();
          this.play();
        }
      });
    } else {
      this.play();
    }
  }

  play() {
    if (this.started) return;
    this.started = true;
    this.sprite.setVisible(true);
    this.sfx = this.sound.add('besiSplashSfx');
    this.sfx.play();
    this.sprite.play(this.animKey);
    this.sprite.once('animationcomplete', () => this.time.delayedCall(HOLD_MS, () => this.finish()));
    // skip on next input
    this.time.delayedCall(100, () => {
      this.input.once('pointerdown', () => this.finish());
      this.input.keyboard?.once('keydown', () => this.finish());
    });
  }

  finish() {
    if (this.leaving) return;
    this.leaving = true;
    if (this.sfx) this.tweens.add({ targets: this.sfx, volume: 0, duration: FADE_MS });
    this.cameras.main.fadeOut(FADE_MS, 22, 16, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.sfx) this.sfx.stop();
      this.scene.start(NEXT_SCENE);
    });
  }
}
