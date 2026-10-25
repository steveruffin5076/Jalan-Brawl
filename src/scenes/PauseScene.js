import Phaser from 'phaser';
import { DISPLAY, UI } from '../config.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Pause' });
  }

  create() {
    const center = DISPLAY.width / 2;
    this.add.rectangle(center, DISPLAY.height / 2, DISPLAY.width, DISPLAY.height, 0x000000, 0.55)
      .setInteractive();
    this.add.text(center, 180, 'Paused', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      color: '#f4f1e8'
    }).setOrigin(0.5);

    this.makeButton(center, 340, 'Resume', () => this.resumeGame());
    this.makeButton(center, 440, 'Restart', () => this.leave('Game'));
    this.makeButton(center, 540, 'Quit', () => this.leave('Title'));

    this.esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.lockMs = UI.pauseGraceMs;
  }

  update(_time, delta) {
    if (this.lockMs > 0) {
      this.lockMs -= delta;
      return;
    }
    const esc = Phaser.Input.Keyboard.JustDown(this.esc);
    const pause = Phaser.Input.Keyboard.JustDown(this.pauseKey);
    if (esc || pause) this.resumeGame();
  }

  resumeGame() {
    const game = this.scene.get('Game');
    game.pausedForMenu = false;
    this.scene.resume('Game');
    this.scene.stop();
  }

  leave(key) {
    this.scene.stop('HUD');
    this.scene.stop('Game');
    this.scene.start(key);
  }

  makeButton(x, y, label, onPress) {
    const bg = this.add.rectangle(x, y, 320, 72, 0x1e3a5f)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x2a5080));
    bg.on('pointerout', () => bg.setFillStyle(0x1e3a5f));
    bg.on('pointerdown', onPress);
  }
}
