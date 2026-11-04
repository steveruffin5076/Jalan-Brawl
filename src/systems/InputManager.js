import Phaser from 'phaser';
import { INPUT } from '../config.js';

const emptyPresses = {
  attack: false,
  jump: false,
  special: false,
  pause: false
};

function stronger(current, next) {
  return Math.abs(next) > Math.abs(current) ? next : current;
}

export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.touch = null;
    this.prevPad = { attack: false, jump: false, special: false, pause: false };
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      jump: Phaser.Input.Keyboard.KeyCodes.K,
      special: Phaser.Input.Keyboard.KeyCodes.L,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC,
      pauseP: Phaser.Input.Keyboard.KeyCodes.P
    });
    scene.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,W,A,S,D,K');
  }

  poll() {
    const keys = this.keys;
    let moveX = 0;
    let moveY = 0;

    if (keys.left.isDown || keys.a.isDown) moveX -= 1;
    if (keys.right.isDown || keys.d.isDown) moveX += 1;
    if (keys.up.isDown || keys.w.isDown) moveY -= 1;
    if (keys.down.isDown || keys.s.isDown) moveY += 1;

    const pad = this.readPad();
    if (pad) {
      const stickX = Math.abs(pad.leftStick.x) > INPUT.deadZone ? pad.leftStick.x : 0;
      const stickY = Math.abs(pad.leftStick.y) > INPUT.deadZone ? pad.leftStick.y : 0;
      let padX = stickX;
      let padY = stickY;
      if (pad.left) padX = -1;
      else if (pad.right) padX = 1;
      if (pad.up) padY = -1;
      else if (pad.down) padY = 1;
      moveX = stronger(moveX, padX);
      moveY = stronger(moveY, padY);
    }

    if (this.touch) {
      const stick = this.touch.readStick();
      moveX = stronger(moveX, stick.x);
      moveY = stronger(moveY, stick.y);
    }

    const mag = Math.hypot(moveX, moveY);
    if (mag > 1) {
      moveX /= mag;
      moveY /= mag;
    }

    const touchPress = this.touch ? this.touch.consumePresses() : emptyPresses;
    const padPress = this.padPresses(pad);

    return {
      moveX,
      moveY,
      attackPressed: Phaser.Input.Keyboard.JustDown(keys.attack) || padPress.attack || touchPress.attack,
      jumpPressed: Phaser.Input.Keyboard.JustDown(keys.jump) || padPress.jump || touchPress.jump,
      specialPressed: Phaser.Input.Keyboard.JustDown(keys.special) || padPress.special || touchPress.special,
      pausePressed: Phaser.Input.Keyboard.JustDown(keys.pause) || Phaser.Input.Keyboard.JustDown(keys.pauseP) || padPress.pause || touchPress.pause
    };
  }

  padPresses(pad) {
    const start = pad && pad.buttons[9] ? pad.buttons[9].pressed : false;
    const now = {
      attack: !!(pad && pad.A),
      jump: !!(pad && pad.B),
      special: !!(pad && pad.Y),
      pause: !!start
    };
    const edges = {
      attack: now.attack && !this.prevPad.attack,
      jump: now.jump && !this.prevPad.jump,
      special: now.special && !this.prevPad.special,
      pause: now.pause && !this.prevPad.pause
    };
    this.prevPad = now;
    return edges;
  }

  readPad() {
    const pads = this.scene.input.gamepad;
    if (!pads || !pads.pad1) return null;
    return pads.pad1;
  }
}
