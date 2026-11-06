import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DISPLAY, HERO_START, STAGE } from '../src/config.js';
import WaveManager from '../src/systems/WaveManager.js';
import { EXIT_SLACK, entryPoint, exitReady, mapView } from '../src/systems/MapTransition.js';

const stage = JSON.parse(readFileSync(new URL('../src/data/stage1.json', import.meta.url), 'utf8'));

function clearedFlow(fromIndex) {
  const flow = new WaveManager(stage, { spawn() {}, alive: () => false, clearCorpses() {}, onStageClear() {} });
  flow.sectionIndex = fromIndex + 1;
  flow.locked = false;
  flow.showGo = true;
  return flow;
}

test('each map shows exactly its own section', () => {
  stage.sections.forEach((section, index) => {
    const view = mapView(stage, index);
    assert.equal(view.scroll, section.span[0]);
    assert.equal(view.left, section.span[0] + STAGE.left);
    assert.equal(view.right, section.span[0] + STAGE.right);
    assert.ok(view.scroll + DISPLAY.width <= stage.worldWidth);
  });
});

test('the next map cannot be reached before the current map is cleared', () => {
  const view = mapView(stage, 0);
  const player = { x: view.right, z: 0, state: 'walk' };
  const flow = new WaveManager(stage, { spawn() {}, alive: () => true, clearCorpses() {}, onStageClear() {} });
  assert.equal(exitReady(flow, 0, player, view), false);
  flow.locked = true;
  assert.equal(exitReady(flow, 0, player, view), false);
});

test('walking into the right edge after GO starts the fade', () => {
  const view = mapView(stage, 0);
  const flow = clearedFlow(0);
  assert.equal(exitReady(flow, 0, { x: view.right - EXIT_SLACK - 1, z: 0, state: 'walk' }, view), false);
  assert.equal(exitReady(flow, 0, { x: view.right, z: 0, state: 'walk' }, view), true);
  assert.equal(exitReady(flow, 0, { x: view.right, z: 30, state: 'jump' }, view), false);
  assert.equal(exitReady(flow, 0, { x: view.right, z: 0, state: 'dead' }, view), false);
  assert.equal(exitReady(flow, 1, { x: mapView(stage, 1).right, z: 0, state: 'idle' }, mapView(stage, 1)), false);
});

test('the hero enters each map on the left, before that map fight trigger', () => {
  stage.sections.forEach((section, index) => {
    const spot = entryPoint(stage, index);
    assert.equal(spot.x, section.span[0] + HERO_START.x);
    assert.equal(spot.y, HERO_START.y);
    assert.ok(spot.x < section.triggerX);
  });
});
