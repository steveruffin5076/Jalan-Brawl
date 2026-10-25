import Phaser from 'phaser';

/** Hands off to Preload. Loading-bar art arrives with real assets. */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    const preview = new URLSearchParams(window.location.search).get('preview');
    this.scene.start(preview === '1' ? 'AnimPreview' : 'Preload');
  }
}
