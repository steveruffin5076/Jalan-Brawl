import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { addArcadeButton, addPanel, UI_COLORS } from '../src/ui/ArcadeUI.js';

class Item extends EventEmitter {
  setStrokeStyle() { return this; }
  setInteractive() { this.interactive = true; return this; }
  setOrigin() { return this; }
  setFillStyle(color) { this.color = color; return this; }
}
function fakeScene() {
  const items = [];
  const played = [];
  const make = (type, ...args) => { const item = new Item(); item.type = type; item.args = args; items.push(item); return item; };
  return { items, played, add: {
    rectangle: (...args) => make('rectangle', ...args),
    circle: (...args) => make('circle', ...args),
    text: (...args) => make('text', ...args)
  }, sound: { play: key => played.push(key) } };
}

test('themed button preserves hover, sound and activation', () => {
  const scene = fakeScene(); let activated = 0;
  const text = addArcadeButton(scene, 100, 100, 'Start', () => activated++);
  const button = scene.items.find(item => item.interactive);
  button.emit('pointerover'); assert.equal(button.color, UI_COLORS.hover);
  button.emit('pointerout'); assert.equal(button.color, UI_COLORS.button);
  button.emit('pointerdown');
  assert.equal(activated, 1);
  assert.deepEqual(scene.played, ['menuHover', 'menuConfirm']);
  assert.equal(text.args[2], 'Start');
});

test('decorative panel has no input targets', () => {
  const scene = fakeScene();
  addPanel(scene, 640, 360, 520, 582);
  assert.equal(scene.items.some(item => item.interactive), false);
});
