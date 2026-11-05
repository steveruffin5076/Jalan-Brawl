import { wireMenuSounds } from './MenuSounds.js';

/** Confirmation stays in the pause scene, with Cancel as the keyboard default. */
export default class ConfirmLeavePanel {
  constructor(scene, action, onConfirm, onClose) {
    this.scene = scene;
    this.onConfirm = onConfirm;
    this.onClose = onClose;
    this.root = scene.add.container(0, 0).setDepth(10000);
    this.add(scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.78).setInteractive());
    this.add(scene.add.rectangle(640, 360, 690, 350, 0x101c2c, 0.98).setStrokeStyle(3, 0xb8945e));
    this.text(640, 255, action === 'restart' ? 'RESTART THE FIGHT?' : 'QUIT TO TITLE?', 32, true);
    this.text(640, 315, 'Current fight progress will be lost.', 22);
    this.text(640, 350, 'Cancel returns to the paused game.', 18);
    this.button(485, 425, 'Cancel', () => this.close());
    this.button(795, 425, action === 'restart' ? 'Restart' : 'Quit', () => this.confirm());
    this.text(640, 493, 'Enter / Esc / P: Cancel', 16);

    this.onEnter = () => this.close();
    scene.input.keyboard?.on('keydown-ENTER', this.onEnter);
    this.onShutdown = () => this.destroy(false);
    scene.events.once('shutdown', this.onShutdown);
  }

  add(item) { this.root.add(item); return item; }

  text(x, y, message, size, bold = false) {
    return this.add(this.scene.add.text(x, y, message, {
      fontFamily: 'Arial, sans-serif', fontStyle: bold ? 'bold' : 'normal',
      fontSize: `${size}px`, color: '#f8ead0'
    }).setOrigin(0.5));
  }

  button(x, y, label, action) {
    const bg = this.add(this.scene.add.rectangle(x, y, 260, 64, 0x17283a)
      .setStrokeStyle(2, 0xb8945e).setInteractive({ useHandCursor: true }));
    this.text(x, y, label, 24, true);
    wireMenuSounds(this.scene, bg, action, { normal: 0x17283a, hover: 0x94632f });
  }

  confirm() {
    if (!this.root) return;
    this.close();
    this.onConfirm();
  }

  close() { this.destroy(true); }

  destroy(notify) {
    if (!this.root) return;
    this.scene.input.keyboard?.off('keydown-ENTER', this.onEnter);
    this.scene.events.off('shutdown', this.onShutdown);
    this.root.destroy(true);
    this.root = null;
    if (notify) this.onClose();
  }
}
