import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import ControlsGuide, { shouldShowControls, markControlsSeen } from '../src/ui/ControlsGuide.js';

class Item extends EventEmitter {
  constructor() { super(); this.children = []; }
  setDepth() { return this; } setInteractive() { return this; }
  setStrokeStyle() { return this; } setOrigin() { return this; }
  setFillStyle() { return this; }
  add(item) { this.children.push(item); return this; }
  destroy() { this.destroyed = true; }
}
function fakeScene() {
  const keyboard = new EventEmitter();
  const gamepad = new EventEmitter();
  const events = new EventEmitter();
  return { input: { keyboard, gamepad }, events,
    add: { container: () => new Item(), rectangle: () => new Item(), text: () => new Item() } };
}

test('guide supports keyboard and gamepad dismissal, cleans up and closes only once', () => {
  const scene = fakeScene(); let closed = 0;
  const guide = new ControlsGuide(scene, () => closed++);
  scene.input.gamepad.emit('down', {}, { index: 1 });
  assert.equal(closed, 0);
  scene.input.keyboard.emit('keydown-ENTER');
  scene.input.gamepad.emit('down', {}, { index: 0 });
  assert.equal(closed, 1);
  assert.equal(guide.root, null);
  assert.equal(scene.input.keyboard.listenerCount('keydown-ENTER'), 0);
  assert.equal(scene.input.gamepad.listenerCount('down'), 0);
});

test('scene shutdown cleans up without starting a fight', () => {
  const scene = fakeScene(); let closed = 0;
  const guide = new ControlsGuide(scene, () => closed++);
  scene.events.emit('shutdown');
  assert.equal(closed, 0);
  assert.equal(guide.root, null);
  assert.equal(scene.input.keyboard.listenerCount('keydown-SPACE'), 0);
});

test('first-play preference persists and handles blocked storage', () => {
  let value = null;
  const storage = { getItem: () => value, setItem: (_key, next) => { value = next; } };
  assert.equal(shouldShowControls(storage), true);
  markControlsSeen(storage);
  assert.equal(value, '1');
  assert.equal(shouldShowControls(storage), false);
  assert.equal(shouldShowControls({ getItem() { throw Error('blocked'); } }), false);
});
