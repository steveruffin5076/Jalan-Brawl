import { wireMenuSounds } from './MenuSounds.js';

export const UI_COLORS = {
  panel: 0x101c2c,
  button: 0x17283a,
  hover: 0x94632f,
  border: 0xb8945e,
  light: '#f8ead0'
};

/** Layered, brass-framed panels use game objects rather than baked text. */
export function addPanel(scene, x, y, width, height, alpha = 0.96) {
  scene.add.rectangle(x + 4, y + 5, width, height, 0x05090e, 0.6);
  scene.add.rectangle(x, y, width, height, UI_COLORS.panel, alpha).setStrokeStyle(3, UI_COLORS.border);
  scene.add.rectangle(x, y, width - 12, height - 12, 0x000000, 0).setStrokeStyle(1, 0x655138);
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
    scene.add.circle(x + dx * (width / 2 - 8), y + dy * (height / 2 - 8), 2.5, 0xd4b27c);
  }
}

export function addArcadeButton(scene, x, y, label, onPress, width = 360, height = 68) {
  scene.add.rectangle(x + 3, y + 4, width, height, 0x05080c, 0.7);
  const bg = scene.add.rectangle(x, y, width, height, UI_COLORS.button)
    .setStrokeStyle(3, UI_COLORS.border)
    .setInteractive({ useHandCursor: true });
  scene.add.rectangle(x, y, width - 12, height - 12, 0x000000, 0).setStrokeStyle(1, 0x655138);
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
    scene.add.circle(x + dx * (width / 2 - 8), y + dy * (height / 2 - 8), 2, 0xd4b27c);
  }
  const text = scene.add.text(x, y, label, {
    fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '26px',
    color: UI_COLORS.light, stroke: '#14100d', strokeThickness: 3
  }).setOrigin(0.5);
  wireMenuSounds(scene, bg, onPress, { normal: UI_COLORS.button, hover: UI_COLORS.hover });
  return text;
}
