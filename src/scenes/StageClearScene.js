import Phaser from 'phaser';
import { addArcadeButton } from '../ui/ArcadeUI.js';
import { DISPLAY } from '../config.js';
import { playResultCue } from '../systems/GameplayAudio.js';

export default class StageClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageClear' });
  }

  create() {
    playResultCue(this, 'stage-clear');
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
    return addArcadeButton(this, x, y, label, onPress);
  }
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
