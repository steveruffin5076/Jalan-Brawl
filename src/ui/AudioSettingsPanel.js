import { audioSettings } from '../systems/AudioSettings.js';

/** In-canvas modal, usable with mouse or touch at any game scale. */
export default class AudioSettingsPanel {
  constructor(scene, onClose) {
    this.scene = scene;
    this.onClose = onClose;
    this.drag = null;
    this.rows = [];
    this.root = scene.add.container(0, 0).setDepth(10000);
    this.add(scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.78).setInteractive());
    this.add(scene.add.rectangle(640, 360, 820, 600, 0x10243a, 0.98).setStrokeStyle(3, 0xcea657));
    this.text(640, 112, 'Audio Settings', 38).setOrigin(0.5);
    this.text(640, 153, 'Tap or drag to adjust', 18, '#aebed2').setOrigin(0.5);

    this.slider('music', 'Music', 220);
    this.slider('effects', 'Sound effects', 315);
    this.slider('ambience', 'Street ambience', 410);
    this.muteLabel = this.button(490, 520, 250, 'Mute', () => {
      audioSettings.set('muted', !audioSettings.values.muted);
      scene.sound.mute = audioSettings.values.muted;
    });
    this.button(790, 520, 250, 'Close', () => this.close());
    this.text(640, 585, 'Settings are saved on this device', 17, '#aebed2').setOrigin(0.5);

    this.onMove = pointer => {
      if (this.drag && pointer.id === this.drag.pointerId && pointer.isDown) this.setSlider(this.drag.key, pointer.x);
    };
    this.onUp = pointer => { if (this.drag && pointer.id === this.drag.pointerId) this.drag = null; };
    scene.input.on('pointermove', this.onMove);
    scene.input.on('pointerup', this.onUp);
    scene.input.on('gameout', this.onUp);
    this.unsubscribe = audioSettings.subscribe(() => this.refresh());
    this.onShutdown = () => this.close();
    scene.events.once('shutdown', this.onShutdown);
    this.refresh();
  }

  add(item) { this.root.add(item); return item; }

  text(x, y, content, size, color = '#f4f1e8') {
    return this.add(this.scene.add.text(x, y, content, { fontFamily: 'sans-serif', fontSize: `${size}px`, color }));
  }

  slider(key, label, y) {
    const left = 565;
    const width = 300;
    this.text(280, y, label, 25).setOrigin(0, 0.5);
    this.add(this.scene.add.rectangle(left + width / 2, y, width, 14, 0x394e64));
    const fill = this.add(this.scene.add.rectangle(left, y, width, 14, 0xe2ad57).setOrigin(0, 0.5));
    const knob = this.add(this.scene.add.circle(left, y, 16, 0xffe0a0));
    const target = this.add(this.scene.add.rectangle(left + width / 2, y, width + 40, 64, 0x000000, 0.001).setInteractive({ useHandCursor: true }));
    const value = this.text(925, y, '', 23).setOrigin(1, 0.5);
    target.on('pointerdown', pointer => {
      this.drag = { key, pointerId: pointer.id };
      this.setSlider(key, pointer.x);
    });
    this.rows.push({ key, left, width, fill, knob, value });
  }

  setSlider(key, x) {
    const row = this.rows.find(item => item.key === key);
    if (!row) return;
    const value = Math.round(Math.max(0, Math.min(1, (x - row.left) / row.width)) * 100) / 100;
    audioSettings.set(key, value);
  }

  button(x, y, width, label, action) {
    const bg = this.add(this.scene.add.rectangle(x, y, width, 62, 0x17283a).setStrokeStyle(2, 0xb8945e).setInteractive({ useHandCursor: true }));
    const text = this.text(x, y, label, 24).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x94632f));
    bg.on('pointerout', () => bg.setFillStyle(0x17283a));
    bg.on('pointerdown', action);
    return text;
  }

  refresh() {
    for (const row of this.rows) {
      const value = audioSettings.values[row.key];
      row.fill.setScale(value, 1);
      row.knob.x = row.left + row.width * value;
      row.value.setText(`${Math.round(value * 100)}%`);
    }
    this.muteLabel.setText(audioSettings.values.muted ? 'Unmute' : 'Mute');
  }

  close() {
    if (!this.root) return;
    this.scene.input.off('pointermove', this.onMove);
    this.scene.input.off('pointerup', this.onUp);
    this.scene.input.off('gameout', this.onUp);
    this.scene.events.off('shutdown', this.onShutdown);
    this.unsubscribe();
    this.root.destroy(true);
    this.root = null;
    this.onClose();
  }
}
