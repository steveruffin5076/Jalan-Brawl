import Phaser from 'phaser';
import { DISPLAY } from '../config.js';

export default class StageClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageClear' });
  }

  create() {
    const center = DISPLAY.width / 2;
    const score = this.registry.get('score') || 0;
    const timeMs = this.registry.get('timeMs') || 0;
    const combo = this.registry.get('maxCombo') || 0;

    this.add.text(center, 150, 'Stage Clear', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      color: '#f4f1e8'
    }).setOrigin(0.5);
    this.add.text(center, 230, 'Night in the City', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#9eb0c8'
    }).setOrigin(0.5);
    this.add.text(center, 330, `Score  ${score}`, {
      fontFamily: 'sans-serif',
      fontSize: '36px',
      color: '#f4f1e8'
    }).setOrigin(0.5);
    this.add.text(center, 390, `Time  ${formatTime(timeMs)}`, {
      fontFamily: 'sans-serif',
      fontSize: '36px',
      color: '#f4f1e8'
    }).setOrigin(0.5);
    this.add.text(center, 450, `Max combo  ${combo}`, {
      fontFamily: 'sans-serif',
      fontSize: '36px',
      color: '#f4f1e8'
    }).setOrigin(0.5);

    this.makeButton(center, 550, 'Fight again', () => this.scene.start('Game'));
    this.makeButton(center, 650, 'Title', () => this.scene.start('Title'));
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

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
