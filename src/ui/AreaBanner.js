import { DISPLAY } from '../config.js';

const DISPLAY_MS = 2800;
const FADE_MS = 500;

/** Screen-space label shown once on entering each area, independent of combat waves. */
export default class AreaBanner {
  constructor(scene, sections) {
    this.sections = sections;
    this.seen = new Set();
    this.remaining = 0;
    this.root = scene.add.container(DISPLAY.width / 2, 150).setScrollFactor(0).setDepth(100);
    const shadow = scene.add.rectangle(3, 4, 410, 56, 0x05090e, 0.6);
    const panel = scene.add.rectangle(0, 0, 410, 56, 0x101c2c, 0.94).setStrokeStyle(2, 0xb8945e);
    this.label = scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '25px',
      color: '#f8ead0', stroke: '#14100d', strokeThickness: 3
    }).setOrigin(0.5);
    this.root.add([shadow, panel, this.label]);
    this.root.setVisible(false);
  }

  update(delta, playerX) {
    const section = this.sections.find(({ span }) => playerX >= span[0] && playerX < span[1]);
    if (section && !this.seen.has(section.id)) {
      this.seen.add(section.id);
      this.label.setText(section.name.toUpperCase());
      this.remaining = DISPLAY_MS;
      this.root.setAlpha(1).setVisible(true);
      return;
    }
    if (this.remaining <= 0) return;
    this.remaining = Math.max(0, this.remaining - Math.max(0, delta));
    this.root.setAlpha(Math.min(1, this.remaining / FADE_MS));
    if (this.remaining === 0) this.root.setVisible(false);
  }
}
