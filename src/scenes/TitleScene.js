import Phaser from 'phaser';
import { DISPLAY } from '../config.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    const { width, height } = DISPLAY;

    this.add.text(width / 2, 150, 'Jalan Brawl', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      color: '#f4f1e8'
    }).setOrigin(0.5);

    this.add.text(width / 2, 220, 'Night in the City', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#9eb0c8'
    }).setOrigin(0.5);

    // A circle stays round only when FIT scales both axes equally.
    const marker = this.add.graphics();
    marker.lineStyle(6, 0xf4f1e8, 1);
    marker.strokeCircle(width / 2, 340, 70);
    marker.lineStyle(2, 0x3d8bfd, 1);
    marker.strokeRect(8, 8, width - 16, height - 16);

    this.makeButton(width / 2, 500, 'Start', () => {
      this.scene.start('Game');
    });

    this.fullscreenLabel = this.makeButton(width / 2, 600, 'Fullscreen', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.refreshFullscreenLabel, this);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.refreshFullscreenLabel, this);
    this.events.once('shutdown', () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.refreshFullscreenLabel, this);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.refreshFullscreenLabel, this);
    });
  }

  refreshFullscreenLabel() {
    this.fullscreenLabel.setText(this.scale.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen');
  }

  makeButton(x, y, label, onPress) {
    const bg = this.add.rectangle(x, y, 320, 72, 0x1e3a5f)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x2a5080));
    bg.on('pointerout', () => bg.setFillStyle(0x1e3a5f));
    bg.on('pointerdown', onPress);

    return text;
  }
}
