import Phaser from 'phaser';
import { DISPLAY } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create() {
    const center = DISPLAY.width / 2;
    this.add.text(center, 250, 'Game Over', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      color: '#f4f1e8'
    }).setOrigin(0.5);

    this.makeButton(center, 420, 'Continue', () => {
      this.scene.start('Game');
    });
    this.makeButton(center, 520, 'Title', () => {
      this.scene.start('Title');
    });
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
