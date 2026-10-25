import Fighter from './Fighter.js';
import { HERO_START } from '../config.js';

const NONE = {
  moveX: 0,
  moveY: 0,
  attackPressed: false,
  jumpPressed: false,
  specialPressed: false,
  pausePressed: false
};

export default class Player extends Fighter {
  constructor(scene, x, y, stats, rules) {
    super(scene, x, y, {
      body: stats.body,
      hp: stats.hp,
      hurtbox: stats.hurtbox,
      gravity: stats.gravity,
      rules,
      isPlayer: true,
      atlas: stats.atlas,
      pose: stats.pose
    });
    this.stats = stats;
    this.comboStep = 0;
    this.comboCount = 0;
    this.comboWindowMs = 0;
    this.comboDisplayMs = 0;
    this.lives = rules.lives;
    this.leaving = false;
    scene.registry.set('lives', this.lives);
    scene.registry.set('playerHp', this.hp);
    scene.registry.set('playerMaxHp', this.maxHp);
  }

  update(delta, input = NONE) {
    const phase = this.tick(delta);
    this.tickComboDisplay(delta);

    if (this.state === 'dead') {
      if (this.deadMs <= 0) this.respawn();
      this.clamp();
      return;
    }

    if (phase !== 'free') {
      // A tap during hitstop still counts if the combo window is already open.
      if (phase === 'frozen' && this.state === 'attack' && this.attack && input.attackPressed) {
        const duration = (this.attack.frames / this.attack.fps) * 1000;
        if (this.attackElapsed >= duration * (1 - this.rules.comboBufferPortion)) {
          this.attackBuffered = true;
        }
      }
      this.clamp();
      return;
    }

    if (this.state === 'attack' || this.state === 'special' || this.state === 'jumpAttack') {
      this.advanceAttack(delta, input);
    }

    if (this.state === 'jump' || this.state === 'jumpAttack') {
      this.steerAir(delta, input);
    } else if (this.state === 'idle' || this.state === 'walk') {
      this.tickComboWindow(delta);
      this.readGround(delta, input);
    }

    this.clamp();
  }

  readGround(delta, input) {
    const special = input.specialPressed || (input.attackPressed && input.jumpPressed);
    if (special) {
      this.beginSwing(this.stats.attacks.special, 'special');
      return;
    }
    if (input.jumpPressed) {
      this.state = 'jump';
      this.vz = this.stats.jumpVelocity;
      return;
    }
    if (input.attackPressed) {
      const name = this.stats.combo[this.comboStep];
      this.beginSwing(this.stats.attacks[name], 'attack');
      return;
    }

    const moving = input.moveX !== 0 || input.moveY !== 0;
    this.state = moving ? 'walk' : 'idle';
    const dt = delta / 1000;
    this.x += input.moveX * this.stats.walkSpeedX * dt;
    this.y += input.moveY * this.stats.walkSpeedY * dt;
    if (input.moveX !== 0) this.facing = input.moveX > 0 ? 1 : -1;
  }

  steerAir(delta, input) {
    const dt = delta / 1000;
    this.x += input.moveX * this.stats.walkSpeedX * this.stats.airControl * dt;
    if (input.moveX !== 0) this.facing = input.moveX > 0 ? 1 : -1;
    this.z += this.vz * dt;
    this.vz -= this.stats.gravity * dt;
    if (this.z <= 0) {
      this.z = 0;
      this.vz = 0;
      if (this.state === 'jumpAttack') this.finishAirAttack();
      else this.state = 'idle';
      return;
    }
    if (this.state === 'jump' && input.attackPressed) {
      this.beginSwing(this.stats.attacks.jumpKick, 'jumpAttack');
    }
  }

  advanceAttack(delta, input) {
    this.attackElapsed += delta;
    const duration = (this.attack.frames / this.attack.fps) * 1000;
    const bufferAt = duration * (1 - this.rules.comboBufferPortion);
    if (this.state === 'attack' && input.attackPressed && this.attackElapsed >= bufferAt) {
      this.attackBuffered = true;
    }
    if (this.attackElapsed >= duration) {
      if (this.state === 'jumpAttack') this.finishAirAttack();
      else if (this.state === 'special') this.finishSpecial();
      else this.finishGroundAttack();
    }
  }

  beginSwing(attack, state) {
    super.beginSwing(attack, state);
    this.comboWindowMs = 0;
  }

  finishGroundAttack() {
    const connected = this.attackConnected;
    const buffered = this.attackBuffered;
    this.clearSwing();
    if (!connected) {
      this.comboStep = 0;
      this.state = 'idle';
      return;
    }
    this.comboStep += 1;
    if (this.comboStep >= this.stats.combo.length) this.comboStep = 0;
    if (buffered) {
      this.beginSwing(this.stats.attacks[this.stats.combo[this.comboStep]], 'attack');
    } else {
      this.state = 'idle';
      this.comboWindowMs = this.rules.comboResetMs;
    }
  }

  finishSpecial() {
    this.clearSwing();
    this.comboStep = 0;
    this.state = 'idle';
  }

  finishAirAttack() {
    const stillAirborne = this.z > 0;
    this.clearSwing();
    this.comboStep = 0;
    this.state = stillAirborne ? 'jump' : 'idle';
  }

  respawn() {
    if (this.leaving) return;
    this.lives -= 1;
    this.scene.registry.set('lives', this.lives);
    if (this.lives <= 0) {
      this.leaving = true;
      this.scene.scene.start('GameOver');
      return;
    }
    const spot = this.scene.spawnAnchor ? this.scene.spawnAnchor() : HERO_START;
    this.hp = this.maxHp;
    this.x = spot.x;
    this.y = spot.y;
    this.z = 0;
    this.vz = 0;
    this.vx = 0;
    this.state = 'idle';
    this.facing = 1;
    this.comboStep = 0;
    this.invulnMs = this.rules.invulnMs;
    this.blinkOn = true;
    this.clearSwing();
    this.scene.registry.set('playerHp', this.hp);
  }

  tickComboWindow(delta) {
    if (this.comboWindowMs <= 0) return;
    this.comboWindowMs -= delta;
    if (this.comboWindowMs <= 0) this.comboStep = 0;
  }

  tickComboDisplay(delta) {
    if (this.comboDisplayMs <= 0) return;
    this.comboDisplayMs -= delta;
    if (this.comboDisplayMs <= 0) {
      this.comboCount = 0;
      this.scene.registry.set('combo', 0);
    }
  }

  noteHit() {
    this.comboCount += 1;
    this.comboDisplayMs = this.rules.comboDisplayMs;
    this.scene.registry.set('combo', this.comboCount);
    this.scene.registry.set('playerHp', this.hp);
    const best = this.scene.registry.get('maxCombo') || 0;
    if (this.comboCount > best) this.scene.registry.set('maxCombo', this.comboCount);
  }
}
