import Fighter from './Fighter.js';
import { STAGE } from '../config.js';

export default class Enemy extends Fighter {
  constructor(scene, x, y, stats, rules, side) {
    super(scene, x, y, {
      body: stats.body,
      hp: stats.hp,
      hurtbox: stats.hurtbox,
      gravity: rules.gravity,
      rules,
      name: stats.name,
      superArmor: stats.superArmor,
      entered: false,
      atlas: stats.atlas,
      pose: stats.pose
    });
    this.viewClip = null;
    this.stats = stats;
    this.kind = stats.kind;
    this.side = side;
    this.spawnY = y;
    this.ai = 'approach';
    this.waitMs = 0;
    this.gapMs = 0;
    this.telegraphMs = 0;
    this.dashDir = 1;
    this.attackName = '';
  }

  update(delta, director, player) {
    if (this.state === 'dead') {
      director.release(this);
      return;
    }

    const phase = this.tick(delta);
    if (phase === 'frozen') return;
    this.viewClip = null;
    if (phase === 'busy') {
      director.releaseToken(this);
      this.ai = 'approach';
      this.crouch = false;
      return;
    }

    if (this.hp <= 0) {
      this.enterDead();
      director.release(this);
      return;
    }

    director.claimSlot(this, player);
    const playerDown = player.state === 'dead';

    if (this.ai !== 'dash' && this.ai !== 'telegraph') {
      this.facing = player.x >= this.x ? 1 : -1;
    }

    if (this.ai === 'approach') {
      const slot = director.slotFor(this, player);
      this.state = this.moveToward(delta, slot.x, slot.y, 20) ? 'idle' : 'walk';
      if (this.state === 'idle') {
        this.ai = 'wait';
        this.waitMs = Phaser.Math.Between(this.rules.waitMin, this.rules.waitMax);
      }
    } else if (this.ai === 'wait') {
      const slot = director.slotFor(this, player);
      this.state = this.moveToward(delta, slot.x, slot.y, 20) ? 'idle' : 'walk';
      this.waitMs -= delta;
      if (this.waitMs <= 0 && !playerDown) this.ai = 'seek';
    } else if (this.ai === 'seek') {
      const slot = director.slotFor(this, player);
      this.state = this.moveToward(delta, slot.x, slot.y, 20) ? 'idle' : 'walk';
      if (playerDown) this.ai = 'approach';
      else if (director.requestToken(this)) this.ai = 'lineup';
    } else if (this.ai === 'lineup') {
      this.lineUp(delta, player);
    } else if (this.ai === 'gap') {
      this.state = 'idle';
      this.gapMs -= delta;
      if (this.gapMs <= 0) this.beginSwing(this.stats.attacks.punch2, 'attack');
      if (this.state === 'attack') this.ai = 'attack';
    } else if (this.ai === 'attack') {
      this.attackElapsed += delta;
      const duration = (this.attack.frames / this.attack.fps) * 1000;
      if (this.attackElapsed >= duration) this.finishSwing(director);
    } else if (this.ai === 'telegraph') {
      this.state = 'idle';
      this.crouch = false;
      const intro = this.stats.dashIntroFrames || 1;
      const span = this.stats.telegraphMs || 1;
      const progress = 1 - this.telegraphMs / span;
      const index = Math.min(intro - 1, Math.floor(Math.max(0, progress) * intro));
      this.viewClip = { name: this.stats.dashClip || 'dash', index, loop: false };
      this.telegraphMs -= delta;
      if (this.telegraphMs <= 0) this.beginDash();
    } else if (this.ai === 'dash') {
      const dt = delta / 1000;
      this.x += this.dashDir * this.stats.dashSpeed * dt;
      this.facing = this.dashDir;
      this.clamp();
      const field = this.scene.playfield || { left: STAGE.left, right: STAGE.right };
      const pad = this.rules.edgePad;
      if (this.x <= field.left + pad || this.x >= field.right - pad) this.finishDash(director);
    }

    if (this.ai !== 'dash') this.clamp();
  }

  lineUp(delta, player) {
    const aligned = Math.abs(this.y - player.y) <= this.rules.lineupEpsilon;
    if (!aligned) {
      this.state = 'walk';
      this.moveToward(delta, this.x, player.y, this.rules.lineupEpsilon);
      return;
    }
    const gap = Math.abs(this.x - player.x);
    if (gap > this.stats.attackRange) {
      this.state = 'walk';
      const dir = Math.sign(player.x - this.x) || 1;
      this.moveToward(delta, player.x - dir * (this.stats.attackRange * 0.75), player.y, 12);
      return;
    }
    this.facing = player.x >= this.x ? 1 : -1;
    if (this.kind === 'rempit') {
      this.crouch = true;
      this.telegraphMs = this.stats.telegraphMs;
      this.dashDir = this.facing;
      this.ai = 'telegraph';
      this.state = 'idle';
      return;
    }
    const name = this.kind === 'bruiser' ? 'slam' : 'punch1';
    this.attackName = name;
    this.beginSwing(this.stats.attacks[name], 'attack');
    this.ai = 'attack';
  }

  finishSwing(director) {
    const connected = this.attackConnected;
    const followUp = this.attackName === 'punch1' && connected && this.stats.attacks.punch2;
    this.clearSwing();
    if (followUp) {
      this.attackName = 'punch2';
      this.gapMs = this.stats.comboGapMs;
      this.ai = 'gap';
      this.state = 'idle';
      return;
    }
    this.attackName = '';
    director.release(this);
    this.ai = 'approach';
    this.state = 'idle';
  }

  beginDash() {
    this.crouch = false;
    this.facing = this.dashDir;
    this.attackName = 'dash';
    this.beginSwing(this.stats.attacks.dash, 'attack');
    this.ai = 'dash';
  }

  finishDash(director) {
    this.crouch = false;
    this.clearSwing();
    this.attackName = '';
    director.release(this);
    this.ai = 'approach';
    this.state = 'idle';
  }

  moveToward(delta, targetX, targetY, stop) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= stop) return true;
    const dt = delta / 1000;
    this.x += (dx / dist) * this.stats.walkSpeedX * dt;
    this.y += (dy / dist) * this.stats.walkSpeedY * dt;
    return false;
  }
}
