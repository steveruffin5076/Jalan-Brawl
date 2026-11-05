import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import AttackBoost from '../src/systems/AttackBoost.js';
import CombatSystem from '../src/systems/CombatSystem.js';

const rules = JSON.parse(readFileSync(new URL('../src/data/combat.json', import.meta.url), 'utf8'));

test('boost counts down, refreshes without stacking, expires and clears', () => {
  const values = {};
  const boost = new AttackBoost(rules.attackBoost, { set: (key, value) => { values[key] = value; } });
  const player = { isPlayer: true }, enemy = { isPlayer: false };
  assert.equal(values.attackBoostSeconds, 0);
  assert.equal(boost.damage(player, 4), 4);
  boost.activate();
  assert.equal(values.attackBoostSeconds, 5);
  assert.equal(boost.damage(player, 4), 4.4);
  assert.equal(boost.damage(enemy, 4), 4);
  boost.tick(2100);
  assert.equal(values.attackBoostSeconds, 3);
  boost.activate();
  assert.equal(values.attackBoostSeconds, 5);
  assert.equal(boost.damage(player, 4), 4.4);
  boost.tick(4999);
  assert.equal(values.attackBoostSeconds, 1);
  boost.tick(1);
  assert.equal(values.attackBoostSeconds, 0);
  assert.equal(boost.damage(player, 4), 4);
  boost.activate();
  boost.clear();
  assert.equal(values.attackBoostSeconds, 0);
});

test('boost applies to breakables, but not enemy damage or special health cost', () => {
  const registry = { set() {} };
  const dot = { setVisible() { return this; }, setDepth() { return this; }, setPosition() { return this; } };
  const scene = { registry, add: { circle: () => dot }, combatAudio: { hit() {}, breakProp() {} }, addScore() {} };
  scene.attackBoost = new AttackBoost(rules.attackBoost, registry);
  scene.attackBoost.activate();
  const combat = new CombatSystem(scene, rules);
  const player = { isPlayer: true, hp: 50, attack: { damage: 4, hpCost: 5, hitstun: 100 }, hitSet: new Set(), y: 0, z: 0 };
  const prop = { y: 0, hurtboxWorld: () => ({ x: 0, y: 0, w: 10, h: 10 }), hurt(damage) { this.damage = damage; } };
  const hitbox = { x: 0, y: 0, w: 10, h: 10 };
  combat.tryBreak(player, prop, hitbox);
  assert.equal(prop.damage, 4.4);
  assert.equal(player.hp, 45);
  const enemy = { isPlayer: false, attack: { damage: 4, hitstun: 100 }, hitSet: new Set(), y: 0, z: 0 };
  const target = { isPlayer: true, hp: 50, y: 0, z: 0, canBeHit: () => true, hurtboxWorld: prop.hurtboxWorld };
  combat.tryHit(enemy, target, hitbox);
  assert.equal(target.hp, 46);
});
