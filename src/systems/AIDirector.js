import Phaser from 'phaser';
import { FLOOR, STAGE } from '../config.js';

/** Hands out the two attack tokens and the spots enemies stand on. */
export default class AIDirector {
  constructor(rules) {
    this.rules = rules;
    this.tokens = new Set();
    this.claims = new Map();
    this.left = STAGE.left;
    this.right = STAGE.right;
  }

  /** Screen edges of the locked fight, or the whole street while walking. */
  setBounds(left, right) {
    this.left = left;
    this.right = right;
  }

  /** Drop slots and tokens held by enemies who are down for good. */
  reap(enemies) {
    for (const enemy of enemies) {
      if (enemy.state === 'dead' || enemy.hp <= 0) this.release(enemy);
    }
  }

  claimSlot(enemy, player) {
    if (this.claims.has(enemy)) return;
    const taken = new Set(this.claims.values());
    let best = -1;
    let bestDist = Infinity;
    this.rules.slots.forEach((slot, index) => {
      if (taken.has(index)) return;
      const pos = this.slotAt(slot, player);
      const dist = Math.hypot(pos.x - enemy.x, pos.y - enemy.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    if (best >= 0) this.claims.set(enemy, best);
  }

  slotFor(enemy, player) {
    const index = this.claims.get(enemy);
    if (index === undefined) {
      const x = enemy.side === 'left' ? this.left + 90 : this.right - 90;
      return { x, y: Phaser.Math.Clamp(enemy.spawnY, FLOOR.top, FLOOR.bottom) };
    }
    return this.slotAt(this.rules.slots[index], player);
  }

  requestToken(enemy) {
    if (this.tokens.has(enemy)) return true;
    if (this.tokens.size >= this.rules.tokens) return false;
    this.tokens.add(enemy);
    return true;
  }

  releaseToken(enemy) {
    this.tokens.delete(enemy);
  }

  release(enemy) {
    this.tokens.delete(enemy);
    this.claims.delete(enemy);
  }

  slotAt(slot, player) {
    return {
      x: Phaser.Math.Clamp(player.x + slot.x, this.left, this.right),
      y: Phaser.Math.Clamp(player.y + slot.y, FLOOR.top, FLOOR.bottom)
    };
  }
}
