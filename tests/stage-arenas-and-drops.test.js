import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DISPLAY, STAGE } from '../src/config.js';
import { createBackdrop } from '../src/systems/StageBackdrop.js';
import WaveManager from '../src/systems/WaveManager.js';
import { awardEnemyKO, rollEnemyDrop } from '../src/systems/EnemyDrops.js';

const stage = JSON.parse(readFileSync(new URL('../src/data/stage1.json', import.meta.url), 'utf8'));

test('each section locks on a complete screen, even after trigger overshoot', () => {
  const spawns = [];
  const flow = new WaveManager(stage, { spawn: spec => spawns.push(spec), alive: () => true, clearCorpses() {}, onStageClear() {} });
  for (let i = 0; i < stage.sections.length; i++) {
    const section = stage.sections[i];
    assert.equal(section.span[0], i * DISPLAY.width);
    assert.equal(section.span[1] - section.span[0], DISPLAY.width);
    assert.equal(section.triggerX, section.span[0] + DISPLAY.width / 2);
    flow.sectionIndex = i;
    flow.locked = false;
    const overshoot = section.triggerX + 9;
    flow.update(16, { x: overshoot, state: 'walk' });
    assert.equal(flow.lockScroll, section.span[0]);
    assert.ok(overshoot >= flow.lockScroll + STAGE.left && overshoot <= flow.lockScroll + STAGE.right);
  }
  assert.equal(stage.worldWidth, stage.sections.length * DISPLAY.width);
  assert.ok(spawns.some(spec => spec.type === 'boss1'));
});

test('every background is a single full image without sky or horizontal crop', () => {
  const plates = [];
  function chain(obj = {}) {
    for (const name of ['setOrigin', 'setScrollFactor', 'setDepth', 'setTileScale', 'fillStyle', 'fillRect', 'fillCircle']) obj[name] = () => obj;
    return obj;
  }
  const scene = { add: {
    tileSprite: () => chain(), graphics: () => chain(),
    image(x, y, key) {
      const image = chain({ x, y, key });
      image.setCrop = (...args) => { image.crop = args; return image; };
      image.setScale = (sx, sy) => { image.scaleX = sx; image.scaleY = sy; return image; };
      plates.push(image); return image;
    }
  } };
  createBackdrop(scene, stage);
  assert.equal(plates.length, stage.sections.length);
  for (const section of stage.sections) {
    const image = plates.find(p => p.key === stage.backdrop.sections[section.id]);
    assert.deepEqual(image.crop, [0, 0, ...stage.backdrop.source]);
    assert.equal(image.x, section.span[0]);
    assert.equal(image.crop[2] * image.scaleX, DISPLAY.width);
    assert.equal(image.crop[3] * image.scaleY, DISPLAY.height);
  }
});

test('regular enemy drops are occasional and use the configured weighted items', () => {
  const config = stage.enemyDrops;
  const roll = (...numbers) => () => numbers.shift();
  assert.equal(rollEnemyDrop('punk', config, roll(0.21)), null);
  assert.equal(rollEnemyDrop('punk', config, roll(0.1, 0)), 'cash');
  assert.equal(rollEnemyDrop('rempit', config, roll(0.1, 0.61)), 'tehTarik');
  assert.equal(rollEnemyDrop('bruiser', config, roll(0.1, 0.95)), 'nasiLemak');
  assert.equal(rollEnemyDrop('boss1', config, roll(0, 0)), null);
  for (const name of Object.keys(config.weights)) assert.ok(stage.pickupTypes[name]);
});

test('a defeated enemy scores and drops no more than once', () => {
  const enemy = { kind: 'punk', state: 'dead' };
  const scores = [], drops = [];
  const callbacks = { score: amount => scores.push(amount), drop: (_enemy, item) => drops.push(item) };
  awardEnemyKO(enemy, stage, callbacks, () => 0);
  awardEnemyKO(enemy, stage, callbacks, () => 0);
  assert.deepEqual(scores, [stage.koScore.punk]);
  assert.deepEqual(drops, ['cash']);
  awardEnemyKO({ kind: 'punk', state: 'hurt' }, stage, callbacks, () => 0);
  assert.equal(drops.length, 1);
});
