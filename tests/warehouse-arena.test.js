import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DISPLAY, STAGE } from '../src/config.js';
import { createBackdrop } from '../src/systems/StageBackdrop.js';

const stage = JSON.parse(readFileSync(new URL('../src/data/stage1.json', import.meta.url), 'utf8'));
const warehouse = stage.sections.find(section => section.id === 'warehouse');

test('boss trigger locks the camera to a full warehouse screen', () => {
  const maxScroll = stage.worldWidth - DISPLAY.width;
  const scroll = Math.max(0, Math.min(maxScroll, warehouse.triggerX - DISPLAY.width / 2));
  assert.equal(warehouse.span[1] - warehouse.span[0], DISPLAY.width);
  assert.equal(scroll, warehouse.span[0]);
  assert.equal(scroll + DISPLAY.width, warehouse.span[1]);
  assert.ok(warehouse.triggerX >= scroll + STAGE.left);
  assert.ok(warehouse.triggerX <= scroll + STAGE.right);
  assert.ok(warehouse.triggerX > stage.sections.at(-2).triggerX);
  assert.equal(warehouse.span[1], stage.worldWidth);
});

test('warehouse backdrop keeps the entire source image including its ceiling', () => {
  const plates = [];
  function chain(obj = {}) {
    for (const name of ['setOrigin', 'setScrollFactor', 'setDepth', 'setTileScale', 'fillStyle', 'fillRect', 'fillCircle']) obj[name] = () => obj;
    return obj;
  }
  const scene = { add: {
    tileSprite: () => chain(),
    image(x, y, key) {
      const image = chain({ x, y, key });
      image.setCrop = (...crop) => { image.crop = crop; return image; };
      image.setScale = (xScale, yScale) => { image.scaleX = xScale; image.scaleY = yScale; return image; };
      plates.push(image);
      return image;
    },
    graphics: () => chain()
  } };
  createBackdrop(scene, stage);
  const images = plates.filter(image => image.key === stage.backdrop.sections.warehouse);
  assert.equal(images.length, 1);
  assert.deepEqual(images[0].crop, [0, 0, ...stage.backdrop.source]);
  assert.equal(images[0].x, warehouse.span[0]);
  assert.equal(images[0].crop[2] * images[0].scaleX, DISPLAY.width);
  assert.equal(images[0].crop[3] * images[0].scaleY, DISPLAY.height);
  const outdoor = plates.find(image => image.key === stage.backdrop.sections.underpass);
  assert.equal(outdoor.crop[1], Math.round(stage.backdrop.source[1] * stage.backdrop.skyCrop));
});
