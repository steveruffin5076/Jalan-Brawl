import Phaser from 'phaser';
import { DISPLAY } from '../config.js';
import SceneAudio from '../systems/SceneAudio.js';
import { wireMenuSounds } from '../ui/MenuSounds.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    const { width, height } = DISPLAY;
    this.backgroundAudio = new SceneAudio(this);
    this.backgroundAudio.setMusic('menuMusic');

    // Cover the display without stretching the artwork.
    const background = this.add.image(width / 2, height / 2, 'menuBackground');
    background.setScale(Math.max(width / background.width, height / background.height));

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

    wireMenuSounds(this, bg, onPress);

    return text;
  }
}
