import Phaser from 'phaser';
import { addArcadeButton, addPanel } from '../ui/ArcadeUI.js';
import AudioSettingsPanel from '../ui/AudioSettingsPanel.js';
import ControlsGuide from '../ui/ControlsGuide.js';
import { DISPLAY, UI } from '../config.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Pause' });
  }

  create() {
    const center = DISPLAY.width / 2;
    this.add.rectangle(center, DISPLAY.height / 2, DISPLAY.width, DISPLAY.height, 0x000000, 0.55)
      .setInteractive();
    addPanel(this, center, 369, 520, 582);
    this.add.text(center, 145, 'PAUSED', {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '48px',
      color: '#f8ead0', stroke: '#14100d', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.rectangle(center, 183, 310, 2, 0xb8945e);
    this.add.text(center, 626, 'JALAN BRAWL  •  PAUSE MENU', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#ba9b71'
    }).setOrigin(0.5);

    this.audioPanel = null;
    this.controlsGuide = null;
    this.makeButton(center, 230, 'Resume', () => this.resumeGame());
    this.makeButton(center, 310, 'Controls', () => {
      if (!this.controlsGuide) this.controlsGuide = new ControlsGuide(this, () => { this.controlsGuide = null; });
    });
    this.makeButton(center, 390, 'Audio Settings', () => {
      if (!this.audioPanel) this.audioPanel = new AudioSettingsPanel(this, () => { this.audioPanel = null; });
    });
    this.makeButton(center, 470, 'Restart', () => this.leave('Game'));
    this.makeButton(center, 550, 'Quit', () => this.leave('Title'));

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
    if (this.controlsGuide || this.audioPanel) {
      if (esc || pause) (this.controlsGuide || this.audioPanel).close();
      return;
    }
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
    return addArcadeButton(this, x, y, label, onPress);
  }
}
