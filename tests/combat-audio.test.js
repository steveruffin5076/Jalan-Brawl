import test from 'node:test';
import assert from 'node:assert/strict';
import CombatAudio from '../src/systems/CombatAudio.js';
import CombatSystem from '../src/systems/CombatSystem.js';

function setup() {
  const played = [];
  const audio = new CombatAudio({ play: key => played.push(key) });
  return { audio, played };
}

test('impacts follow actual hits, once per swing, and select attack strength', () => {
  const { audio, played } = setup();
  const fighter = { isPlayer: true, hitSet: new Set(), attack: { anim: 'jab1' } };
  audio.hit(fighter);
  audio.hit(fighter);
  fighter.hitSet = new Set();
  fighter.attack = { anim: 'kick', knockdown: true };
  audio.hit(fighter);
  fighter.hitSet = new Set();
  fighter.attack = { anim: 'special', knockdown: true };
  audio.hit(fighter);
  assert.deepEqual(played, ['combat-hit-light', 'combat-hit-heavy', 'combat-hit-special']);
});

test('prop breaks play only after a valid breaking hit', () => {
  const { audio, played } = setup();
  const dot = { setVisible() { return this; }, setDepth() { return this; }, setPosition() { return this; } };
  const scene = { combatAudio: audio, add: { circle: () => dot } };
  const system = new CombatSystem(scene, { depthLane: 24, propDepthLane: 40, sparkMs: 120 });
  const attacker = { y: 0, z: 0, hitSet: new Set(), attack: { damage: 4 }, isPlayer: false };
  const prop = { y: 0, broken: false, spec: { image: 'crate' }, hp: 8,
    hurtboxWorld: () => ({ x: 0, y: 0, w: 10, h: 10 }),
    hurt(amount) { this.hp -= amount; this.broken = this.hp <= 0; } };
  const hitbox = { x: 0, y: 0, w: 10, h: 10 };
  system.tryBreak(attacker, prop, hitbox);
  assert.deepEqual(played, []);
  attacker.hitSet = new Set();
  system.tryBreak(attacker, prop, hitbox);
  assert.deepEqual(played, ['combat-crate-break']);
  audio.breakProp({ spec: { image: 'bin' } });
  assert.equal(played.at(-1), 'combat-bin-break');
});

test('enemy cues play on transitions; slam fires once at its active frame', () => {
  const { audio, played } = setup();
  const rempit = { kind: 'rempit', ai: 'telegraph' };
  audio.enemyUpdate(rempit, 'lineup');
  audio.enemyUpdate(rempit, 'telegraph');
  rempit.ai = 'dash';
  audio.enemyUpdate(rempit, 'telegraph');
  audio.enemyUpdate({ kind: 'boss1', ai: 'dash' }, 'telegraph');
  const bruiser = { kind: 'bruiser', attack: { anim: 'slam', active: [0.8, 0.9], playFrames: 10, playFps: 10 }, attackElapsed: 799, hitSet: new Set() };
  audio.enemyUpdate(bruiser, 'attack');
  bruiser.attackElapsed = 800;
  audio.enemyUpdate(bruiser, 'attack');
  audio.enemyUpdate(bruiser, 'attack');
  audio.hit(bruiser);
  assert.deepEqual(played, ['combat-rempit-warning', 'combat-rempit-charge', 'combat-towkay-lariat', 'combat-bruiser-slam']);
});

test('knockdown sound plays at ground contact only', () => {
  const { audio, played } = setup();
  audio.landing({ state: 'knockdown', lying: false }, false);
  audio.landing({ state: 'knockdown', lying: true }, false);
  audio.landing({ state: 'knockdown', lying: true }, true);
  audio.landing({ state: 'idle', lying: true }, false);
  assert.deepEqual(played, ['combat-knockdown']);
});
