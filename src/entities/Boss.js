import { attackDuration } from '../systems/HeroAnims.js';
import Enemy from './Enemy.js';

/** Towkay ignores the mob attack limit and runs his own combo and lariat. */
export default class Boss extends Enemy {
  constructor(scene, x, y, stats, rules, side) {
    super(scene, x, y, stats, rules, side);
    this.calledBackup = false;
    this.pendingCall = false;
    this.nextIsLariat = true;
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
      this.ai = 'approach';
      this.crouch = false;
      this.attackName = '';
      this.nextIsLariat = true;
      return;
    }

    if (this.hp <= 0) {
      this.enterDead();
      director.release(this);
      return;
    }

    this.callBackup();

    if (this.ai !== 'dash' && this.ai !== 'telegraph' && this.ai !== 'call') {
      this.facing = player.x >= this.x ? 1 : -1;
    }

    if (this.ai === 'approach') {
      if (player.state === 'dead') {
        this.state = 'idle';
      } else {
        this.approach(delta, player);
      }
    } else if (this.ai === 'gap') {
      this.state = 'idle';
      this.gapMs -= delta;
      if (this.gapMs <= 0) {
        this.beginSwing(this.stats.attacks[this.attackName], 'attack');
        this.ai = 'attack';
      }
    } else if (this.ai === 'attack') {
      this.attackElapsed += delta;
      const duration = attackDuration(this.attack);
      if (this.attackElapsed >= duration) this.finishCombo();
    } else if (this.ai === 'call') {
      this.state = 'idle';
      const frames = this.stats.callFrames || 1;
      const elapsed = this.stats.callMs - this.callMs;
      const index = Math.min(frames - 1, Math.floor(Math.max(0, elapsed) / (this.stats.callMs / frames)));
      this.viewClip = { name: 'call', index, loop: false };
      this.callMs -= delta;
      if (this.callMs <= 0) {
        this.viewClip = null;
        this.ai = 'approach';
        this.state = 'idle';
      }
    } else if (this.ai === 'telegraph') {
      this.state = 'idle';
      this.crouch = false;
      this.viewClip = { name: 'lariat', index: 0, loop: false };
      this.telegraphMs -= delta;
      if (this.telegraphMs <= 0) this.beginLariat();
    } else if (this.ai === 'dash') {
      const dt = delta / 1000;
      this.x += this.dashDir * this.stats.dashSpeed * dt;
      this.facing = this.dashDir;
      this.clamp();
      const field = this.scene.playfield;
      const pad = this.rules.edgePad;
      if (this.x <= field.left + pad || this.x >= field.right - pad) this.finishLariat();
    }

    if (this.ai !== 'dash') this.clamp();
  }

  approach(delta, player) {
    const aligned = Math.abs(this.y - player.y) <= this.rules.lineupEpsilon;
    if (!aligned) {
      this.state = 'walk';
      this.moveToward(delta, this.x, player.y, this.rules.lineupEpsilon);
      return;
    }
    const gap = Math.abs(this.x - player.x);
    if (this.nextIsLariat && gap <= this.stats.lariatRange) {
      this.nextIsLariat = false;
      this.dashDir = this.facing;
      this.telegraphMs = this.stats.telegraphMs;
      this.crouch = false;
      this.ai = 'telegraph';
      this.state = 'idle';
      return;
    }
    if (gap > this.stats.attackRange) {
      this.state = 'walk';
      const dir = Math.sign(player.x - this.x) || 1;
      this.moveToward(delta, player.x - dir * (this.stats.attackRange * 0.7), player.y, 12);
      return;
    }
    this.nextIsLariat = true;
    this.attackName = 'punch1';
    this.beginSwing(this.stats.attacks.punch1, 'attack');
    this.ai = 'attack';
  }

  finishCombo() {
    const chain = ['punch1', 'punch2', 'punch3'];
    const index = chain.indexOf(this.attackName);
    this.clearSwing();
    if (index >= 0 && index < chain.length - 1) {
      this.attackName = chain[index + 1];
      this.gapMs = this.stats.comboGapMs;
      this.ai = 'gap';
      this.state = 'idle';
      return;
    }
    this.attackName = '';
    if (this.pendingCall) {
      this.startCall();
      return;
    }
    this.ai = 'approach';
    this.state = 'idle';
  }

  beginLariat() {
    this.crouch = false;
    this.facing = this.dashDir;
    this.attackName = 'lariat';
    this.beginSwing(this.stats.attacks.lariat, 'attack');
    this.ai = 'dash';
  }

  finishLariat() {
    this.crouch = false;
    this.clearSwing();
    this.attackName = '';
    if (this.pendingCall) {
      this.startCall();
      return;
    }
    this.ai = 'approach';
    this.state = 'idle';
  }

  callBackup() {
    if (this.calledBackup || this.ai === 'call') return;
    const due = this.pendingCall || this.hp <= this.maxHp * this.stats.backupAt;
    if (!due) return;
    if (this.ai === 'dash' || this.ai === 'attack' || this.ai === 'telegraph' || this.ai === 'gap') {
      this.pendingCall = true;
      return;
    }
    this.startCall();
  }

  startCall() {
    this.calledBackup = true;
    this.pendingCall = false;
    this.callMs = this.stats.callMs;
    this.attackName = '';
    this.clearSwing();
    this.ai = 'call';
    this.state = 'idle';
    this.scene.spawnBackup();
  }
}
