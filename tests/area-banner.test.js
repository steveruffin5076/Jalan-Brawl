import test from 'node:test';
import assert from 'node:assert/strict';
import AreaBanner from '../src/ui/AreaBanner.js';

class Item {
  constructor() { this.visible = true; this.alpha = 1; this.children = []; }
  setScrollFactor(value) { this.scrollFactor = value; return this; }
  setDepth(value) { this.depth = value; return this; }
  setStrokeStyle() { return this; }
  setOrigin() { return this; }
  setText(text) { this.text = text; return this; }
  setVisible(value) { this.visible = value; return this; }
  setAlpha(value) { this.alpha = value; return this; }
  add(children) { this.children.push(...children); return this; }
}
function makeScene() {
  return { add: { container: () => new Item(), rectangle: () => new Item(), text: () => new Item() } };
}
const sections = [
  { id: 'one', name: 'Pasar Malam', span: [0, 1280] },
  { id: 'two', name: 'Shophouse Row', span: [1280, 2560] }
];

test('banner appears on entering each area, fades, and does not repeat for the same area', () => {
  const banner = new AreaBanner(makeScene(), sections);
  assert.equal(banner.root.visible, false);
  banner.update(0, 180);
  assert.equal(banner.label.text, 'PASAR MALAM');
  assert.equal(banner.root.visible, true);
  assert.equal(banner.root.scrollFactor, 0);
  banner.update(2300, 180);
  assert.equal(banner.root.alpha, 1);
  banner.update(250, 180);
  assert.equal(banner.root.alpha, 0.5);
  banner.update(250, 180);
  assert.equal(banner.root.visible, false);
  banner.update(16, 1279);
  assert.equal(banner.root.visible, false);
  banner.update(16, 1280);
  assert.equal(banner.label.text, 'SHOPHOUSE ROW');
  assert.equal(banner.root.visible, true);
  banner.update(2800, 1280);
  banner.update(16, 100);
  assert.equal(banner.root.visible, false);
});

test('a new game gets a fresh banner and crossing a boundary replaces the previous label', () => {
  const banner = new AreaBanner(makeScene(), sections);
  banner.update(0, 180);
  banner.update(100, 1300);
  assert.equal(banner.label.text, 'SHOPHOUSE ROW');
  assert.equal(banner.remaining, 2800);
  const restarted = new AreaBanner(makeScene(), sections);
  restarted.update(0, 180);
  assert.equal(restarted.label.text, 'PASAR MALAM');
});
