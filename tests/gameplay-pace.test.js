import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fasterMovement, fasterCombat, PACE_MULTIPLIER } from '../src/systems/GameplayPace.js';

const fighters = JSON.parse(readFileSync(new URL('../src/data/fighters.json', import.meta.url), 'utf8'));
const rules = JSON.parse(readFileSync(new URL('../src/data/combat.json', import.meta.url), 'utf8'));

test('all fighters get faster movement without mutating base stats or attack data', () => {
  for (const stats of Object.values(fighters)) {
    const adjusted = fasterMovement(stats);
    assert.equal(adjusted.walkSpeedX, stats.walkSpeedX * 1.15);
    assert.equal(adjusted.walkSpeedY, stats.walkSpeedY * 1.15);
    if (stats.dashSpeed) assert.equal(adjusted.dashSpeed, stats.dashSpeed * 1.15);
    assert.equal(adjusted.attacks, stats.attacks);
    assert.deepEqual(fasterMovement(stats, 1), stats);
    assert.equal(fasterMovement(stats).walkSpeedX, adjusted.walkSpeedX); // no stacking on restart
  }
  assert.equal(PACE_MULTIPLIER, 1.15);
});

test('impact pauses are shorter while other combat rules are unchanged and reversible', () => {
  const adjusted = fasterCombat(rules);
  assert.equal(adjusted.hitstopMs, rules.hitstopMs / 1.15);
  assert.equal(adjusted.hitstopKnockdownMs, rules.hitstopKnockdownMs / 1.15);
  assert.equal(adjusted.comboDisplayMs, rules.comboDisplayMs);
  assert.equal(adjusted.attackBoost, rules.attackBoost);
  assert.deepEqual(fasterCombat(rules, 1), rules);
});
