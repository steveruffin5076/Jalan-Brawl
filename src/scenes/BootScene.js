import Phaser from 'phaser';

/** Hands off to Preload. Loading-bar art arrives with real assets. */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    const preview = new URLSearchParams(window.location.search).get('preview');
    if (preview === '1') this.scene.start('AnimPreview');
    else this.scene.start('BesiSplash');
  }
}
