import Phaser from 'phaser';
import { INPUT, TOUCH } from '../config.js';

/** On-screen stick and buttons. Created only when the device has touch. */
export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.radius = TOUCH.joystickRadius;
    this.latches = { attack: false, jump: false, special: false, pause: false };
    this.owned = [];

    const base = scene.add.circle(0, 0, this.radius, 0xffffff, 0.18);
    const thumb = scene.add.circle(0, 0, 36, 0xffffff, 0.45);
    this.joystick = scene.plugins.get('rexVirtualJoystick').add(scene, {
      x: TOUCH.joystickX,
      y: TOUCH.joystickY,
      radius: this.radius,
      base,
      thumb,
      fixed: true
    });
    this.joystick.base.setDepth(10000);
    this.joystick.thumb.setDepth(10001);
    this.pin();

    this.makeButton(1040, 470, TOUCH.button, 'SP', 'special');
    this.makeButton(1188, 500, TOUCH.button, 'JUMP', 'jump');
    this.makeButton(1088, 610, TOUCH.attackButton, 'ATK', 'attack');
    this.makeButton(1232, 56, TOUCH.pauseButton, 'II', 'pause');
  }

  makeButton(x, y, size, label, latch) {
    const bg = this.scene.add.circle(x, y, size / 2, 0xffffff, 0.22)
      .setScrollFactor(0)
      .setDepth(10002)
      .setInteractive();
    const text = this.scene.add.text(x, y, label, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10003);

    bg.on('pointerdown', () => {
      this.latches[latch] = true;
      bg.setFillStyle(0xffffff, 0.45);
    });
    const release = () => bg.setFillStyle(0xffffff, 0.22);
    bg.on('pointerup', release);
    bg.on('pointerout', release);
    this.owned.push(bg, text);
  }

  readStick() {
    const fx = this.joystick.forceX;
    const fy = this.joystick.forceY;
    const force = Math.hypot(fx, fy);
    if (force < this.radius * INPUT.deadZone) {
      return { x: 0, y: 0 };
    }
    return {
      x: Phaser.Math.Clamp(fx / this.radius, -1, 1),
      y: Phaser.Math.Clamp(fy / this.radius, -1, 1)
    };
  }

  consumePresses() {
    const presses = { ...this.latches };
    this.latches.attack = false;
    this.latches.jump = false;
    this.latches.special = false;
    this.latches.pause = false;
    return presses;
  }

  pin() {
    this.joystick.base.setScrollFactor(0);
    this.joystick.thumb.setScrollFactor(0);
  }

  destroy() {
    this.joystick.destroy();
    for (const node of this.owned) node.destroy();
  }
}
