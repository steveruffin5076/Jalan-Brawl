import test from 'node:test';
import assert from 'node:assert/strict';
import FlyingKick from '../src/systems/FlyingKick.js';

function player(facing = 1) {
  return { x: 100, z: 50, facing, state: 'jumpAttack', attack: {},
    clamp() { this.x = Math.max(0, Math.min(150, this.x)); } };
}

test('airborne kick moves in its starting direction and respects bounds', () => {
  const kick = new FlyingKick();
  const p = player();
  kick.update(p, 100);
  assert.equal(p.x, 125);
  p.facing = -1; // Steering cannot turn the hitbox away from the burst.
  kick.update(p, 200);
  assert.equal(p.facing, 1);
  assert.equal(p.x, 150);
  p.state = 'jump';
  kick.update(p, 100);
  assert.equal(p.x, 150);
  p.state = 'jumpAttack';
  p.attack = {};
  p.facing = -1;
  kick.update(p, 100);
  assert.equal(p.x, 125);
});

test('the burst stops on hitstop, landing, interruption, and can be disabled', () => {
  const kick = new FlyingKick();
  const p = player(-1);
  kick.update(p, 100, true);
  assert.equal(p.x, 100);
  kick.update(p, 100);
  assert.equal(p.x, 75);
  p.z = 0;
  kick.update(p, 100);
  assert.equal(p.x, 75);
  p.z = 50;
  p.state = 'hurt';
  kick.update(p, 100);
  assert.equal(p.x, 75);
  const original = new FlyingKick(0);
  p.state = 'jumpAttack';
  p.facing = 1;
  original.update(p, 100);
  p.facing = -1;
  original.update(p, 100);
  assert.equal(p.x, 75);
  assert.equal(p.facing, -1);
});
