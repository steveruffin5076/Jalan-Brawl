import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import ConfirmLeavePanel from '../src/ui/ConfirmLeavePanel.js';

class Item extends EventEmitter {
  constructor(type, x, y, label) { super(); this.type = type; this.x = x; this.y = y; this.label = label; this.children = []; }
  setDepth() { return this; } setInteractive() { this.interactive = true; return this; }
  setStrokeStyle() { return this; } setOrigin() { return this; }
  setFillStyle() { return this; } add(item) { this.children.push(item); return this; }
  destroy() { this.destroyed = true; }
}
function fakeScene() {
  const keyboard = new EventEmitter(); const events = new EventEmitter();
  return { input: { keyboard }, events, sound: { play() {} }, add: {
    container: () => new Item('container'),
    rectangle: (x, y) => new Item('rectangle', x, y),
    text: (x, y, label) => new Item('text', x, y, label)
  } };
}

test('restart cancel leaves the fight untouched and cleans up', () => {
  const scene = fakeScene(); let confirmed = 0; let closed = 0;
  const panel = new ConfirmLeavePanel(scene, 'restart', () => confirmed++, () => closed++);
  assert.ok(panel.root.children.some(item => item.label === 'RESTART THE FIGHT?'));
  panel.root.children.find(item => item.interactive && item.x === 485).emit('pointerdown');
  assert.equal(confirmed, 0); assert.equal(closed, 1);
  assert.equal(scene.input.keyboard.listenerCount('keydown-ENTER'), 0);
  panel.confirm(); assert.equal(confirmed, 0);
});

test('quit requires explicit confirmation and fires once', () => {
  const scene = fakeScene(); let confirmed = 0; let closed = 0;
  const panel = new ConfirmLeavePanel(scene, 'quit', () => confirmed++, () => closed++);
  assert.ok(panel.root.children.some(item => item.label === 'QUIT TO TITLE?'));
  panel.root.children.find(item => item.interactive && item.x === 795).emit('pointerdown');
  panel.confirm();
  assert.equal(confirmed, 1); assert.equal(closed, 1);
});

test('Enter chooses Cancel; shutdown never confirms or calls close', () => {
  const scene = fakeScene(); let confirmed = 0; let closed = 0;
  new ConfirmLeavePanel(scene, 'restart', () => confirmed++, () => closed++);
  scene.input.keyboard.emit('keydown-ENTER');
  assert.equal(confirmed, 0); assert.equal(closed, 1);
  new ConfirmLeavePanel(scene, 'quit', () => confirmed++, () => closed++);
  scene.events.emit('shutdown');
  assert.equal(confirmed, 0); assert.equal(closed, 1);
  assert.equal(scene.input.keyboard.listenerCount('keydown-ENTER'), 0);
});
