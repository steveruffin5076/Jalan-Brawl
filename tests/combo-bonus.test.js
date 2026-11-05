import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import CombatSystem from '../src/systems/CombatSystem.js';
import AttackBoost from '../src/systems/AttackBoost.js';

const rules = JSON.parse(readFileSync(new URL('../src/data/combat.json', import.meta.url), 'utf8'));
function setup() {
  const scores = [], notices = [];
  const dot = { setDisplaySize() { return this; }, setVisible() { return this; }, setDepth() { return this; }, setPosition() { return this; } };
  const scene = {
    add: { image: () => dot }, combatAudio: { hit() {} },
    addScore: amount => scores.push(amount),
    registry: { set: (key, value) => { if (key === 'comboBonus') notices.push(value); } }
  };
  scene.attackBoost = new AttackBoost(rules.attackBoost, scene.registry);
  const combat = new CombatSystem(scene, rules);
  const attack = { damage: 4, hitstun: 250, knockdown: false };
  const attacker = { isPlayer: true, x: 0, y: 0, z: 0, facing: 1, attack,
    hitSet: new Set(), comboCount: 0, noteHit() { this.comboCount++; } };
  const target = { isPlayer: false, x: 0, y: 0, z: 0, hp: 1000, state: 'idle',
    canBeHit: () => true, hurtboxWorld: () => ({ x: 0, y: 0, w: 10, h: 10 }) };
  return { combat, boost: scene.attackBoost, attacker, target, scores, notices, hitbox: { x: 0, y: 0, w: 10, h: 10 } };
}

test('only 3, 4, and 6 confirmed hits award their cumulative bonus once per combo', () => {
  const { combat, attacker, target, scores, notices, hitbox } = setup();
  for (let i = 1; i <= 7; i++) {
    attacker.hitSet = new Set();
    combat.tryHit(attacker, target, hitbox);
    combat.tryHit(attacker, target, hitbox); // A swing cannot hit the same target twice.
  }
  assert.equal(attacker.comboCount, 7);
  assert.deepEqual(scores, [50, 100, 200]);
  assert.deepEqual(notices, [{ amount: 50, hits: 3 }, { amount: 100, hits: 4 }, { amount: 200, hits: 6 }]);
  assert.equal(target.hp, 1000 - 4 * 4 - 3 * 4.4); // The fourth hit activates the boost afterwards.
  attacker.comboCount = 0; // Existing combo timeout begins a new streak.
  for (let i = 0; i < 4; i++) { attacker.hitSet = new Set(); combat.tryHit(attacker, target, hitbox); }
  assert.deepEqual(scores, [50, 100, 200, 50, 100]);
});

test('misses, out-of-lane and invulnerable targets do not grant bonuses', () => {
  const { combat, attacker, target, scores, hitbox } = setup();
  attacker.comboCount = 2;
  target.y = rules.depthLane + 1;
  combat.tryHit(attacker, target, hitbox);
  target.y = 0;
  target.canBeHit = () => false;
  combat.tryHit(attacker, target, hitbox);
  assert.equal(attacker.comboCount, 2);
  assert.deepEqual(scores, []);
});
