import Phaser from 'phaser';
import fighters from '../data/fighters.json';
import stage1 from '../data/stage1.json';
import atlasIndex from '../data/atlas-index.json';
import { createFighterAnims } from '../systems/HeroAnims.js';

/** Loads atlases, street art, and props, then opens the title. */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  preload() {
    for (const char of atlasIndex) {
      this.load.multiatlas(char, `assets/atlases/${char}.json`, 'assets/atlases');
      this.load.json(`${char}Meta`, `assets/atlases/${char}.meta.json`);
    }

    const backdrop = stage1.backdrop;
    const pictures = [backdrop.far, ...Object.values(backdrop.sections)];
    for (const name of pictures) {
      this.load.image(name, `assets/backgrounds/${name}.jpg`);
    }

    for (const spec of Object.values(stage1.breakableTypes)) {
      this.load.image(spec.image, `assets/props/${spec.image}.png`);
      this.load.image(spec.broken, `assets/props/${spec.broken}.png`);
    }
    for (const spec of Object.values(stage1.pickupTypes)) {
      this.load.image(spec.image, `assets/props/${spec.image}.png`);
    }
  }

  create() {
    for (const char of atlasIndex) {
      const meta = this.cache.json.get(`${char}Meta`);
      if (!meta) continue;
      createFighterAnims(this.anims, char, meta, fighters[char] || {});
    }
    this.scene.start('Title');
  }
}