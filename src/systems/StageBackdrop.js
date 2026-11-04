import { DISPLAY } from '../config.js';

/**
 * Far skyline scrolls slower than the street. Each section image is scaled
 * so a 768 px source is 720 px tall, then the top sky is left out so the
 * skyline can show above the roofs. The street stays on the bottom.
 */
export function createBackdrop(scene, stage) {
  const spec = stage.backdrop;
  const scale = DISPLAY.height / spec.source[1];
  const far = scene.add.tileSprite(0, 0, DISPLAY.width, DISPLAY.height, spec.far)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(-300)
    .setTileScale(scale, scale);

  const seams = [];
  for (const section of stage.sections) {
    const key = spec.sections[section.id];
    const [from, to] = section.span;
    seams.push(...layoutSection(scene, key, from, to, stage.worldWidth, spec, scale));
  }
  drawSeams(scene, seams, spec);
  return far;
}

export function scrollBackdrop(layer, scrollX, spec) {
  layer.tilePositionX = scrollX * spec.farParallax;
  layer.tilePositionY = spec.farShiftY || 0;
}

function layoutSection(scene, key, from, to, worldWidth, spec, scale) {
  const naturalW = spec.source[0] * scale;
  const spanW = to - from;
  const ratio = spanW / naturalW;
  const seams = [];
  if (ratio > spec.tileAbove) {
    let x = from;
    let left = spanW;
    while (left > 1) {
      const drawW = Math.min(naturalW, left);
      addPlate(scene, key, x, drawW, spec, scale, drawW < naturalW - 1);
      x += drawW;
      left -= drawW;
      if (left > 1) seams.push(x);
    }
  } else {
    addPlate(scene, key, from, spanW, spec, scale, ratio < spec.cropBelow);
  }
  if (to < worldWidth - 1) seams.push(to);
  return seams;
}

function addPlate(scene, key, worldX, drawW, spec, scale, cropX) {
  const sourceW = spec.source[0];
  const sourceH = spec.source[1];
  const cropY = Math.round(sourceH * spec.skyCrop);
  const cropH = sourceH - cropY;
  const displayH = cropH * scale;
  let cropLeft = 0;
  let cropWidth = sourceW;
  if (cropX) {
    cropWidth = Math.max(1, Math.min(sourceW, Math.round(drawW / scale)));
    cropLeft = Math.max(0, Math.round((sourceW - cropWidth) / 2));
    cropWidth = Math.min(cropWidth, sourceW - cropLeft);
  }
  // Phaser draws a crop inside the full frame. Scale from the crop size so the
  // picture fills the section instead of leaving the skyline in the gap.
  const image = scene.add.image(worldX, DISPLAY.height, key)
    .setOrigin(0, 1)
    .setDepth(-200)
    .setCrop(cropLeft, cropY, cropWidth, cropH)
    .setScale(drawW / cropWidth, displayH / cropH);
  image.x = worldX - cropLeft * image.scaleX;
}

/** Screen y where the painted street starts, plus a small step onto the road. */
export function streetLine(spec) {
  const sourceH = spec.source[1];
  const scale = DISPLAY.height / sourceH;
  const cropY = Math.round(sourceH * spec.skyCrop);
  const streetY = Math.round(sourceH * spec.street);
  const plateTop = DISPLAY.height - (sourceH - cropY) * scale;
  return Math.ceil(plateTop + (streetY - cropY) * scale + spec.streetPad);
}

function drawSeams(scene, seams, spec) {
  const cropY = Math.round(spec.source[1] * spec.skyCrop);
  const top = DISPLAY.height - (spec.source[1] - cropY) * (DISPLAY.height / spec.source[1]);
  const posts = scene.add.graphics().setDepth(455);
  for (const x of seams) {
    posts.fillStyle(0x24180f, 1);
    posts.fillRect(x - spec.seam.post / 2, top, spec.seam.post, DISPLAY.height - top);
    posts.fillStyle(0xffd27a, 1);
    posts.fillCircle(x, top + 18, spec.seam.lamp);
    posts.fillStyle(0xfff1c9, 0.35);
    posts.fillCircle(x, top + 18, spec.seam.lamp + 10);
  }
}
