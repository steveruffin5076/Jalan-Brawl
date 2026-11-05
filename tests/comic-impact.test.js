import test from 'node:test';
import assert from 'node:assert/strict';
import CombatSystem from '../src/systems/CombatSystem.js';

test('comic impact sprites are pooled, positioned on contact, and hidden after their lifetime', () => {
  const sprites = [];
  const scene = { add: { image(x, y, texture) {
    const sprite = { x, y, texture, visible: true,
      setDisplaySize(w, h) { this.width = w; this.height = h; return this; },
      setVisible(visible) { this.visible = visible; return this; },
      setDepth(depth) { this.depth = depth; return this; },
      setPosition(x, y) { this.x = x; this.y = y; return this; } };
    sprites.push(sprite);
    return sprite;
  } } };
  const system = new CombatSystem(scene, { sparkMs: 120 });
  assert.equal(sprites.length, 8);
  assert.equal(sprites[0].texture, 'comicImpact');
  assert.equal(sprites[0].width, 64);
  assert.equal(sprites[0].visible, false);
  system.spark({ x: 30, y: 40 });
  assert.deepEqual([sprites[0].x, sprites[0].y, sprites[0].visible], [30, 40, true]);
  system.update(119, []);
  assert.equal(sprites[0].visible, true);
  system.update(1, []);
  assert.equal(sprites[0].visible, false);
  system.spark({ x: 10, y: 20 });
  assert.equal(sprites.length, 8);
  assert.deepEqual([sprites[0].x, sprites[0].y, sprites[0].visible], [10, 20, true]);
});
