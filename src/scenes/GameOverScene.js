import Phaser from 'phaser';
import { addArcadeButton } from '../ui/ArcadeUI.js';
import { DISPLAY } from '../config.js';
import { playResultCue } from '../systems/GameplayAudio.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create() {
    playResultCue(this, 'game-over');
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
    return addArcadeButton(this, x, y, label, onPress);
  }
}
