const STORAGE_KEY = 'jalan-brawl-controls-guide-seen';
let seenThisSession = false;

export function shouldShowControls(storage) {
  if (seenThisSession) return false;
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    return target?.getItem(STORAGE_KEY) !== '1';
  } catch { return true; }
}

export function markControlsSeen(storage) {
  seenThisSession = true;
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    target?.setItem(STORAGE_KEY, '1');
  } catch { /* Remember for this session when browser storage is unavailable. */ }
}

/** Modal guide; no gameplay or character state is changed. */
export default class ControlsGuide {
  constructor(scene, onClose) {
    this.scene = scene;
    this.onClose = onClose;
    this.root = scene.add.container(0, 0).setDepth(10000);
    this.add(scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8).setInteractive());
    this.add(scene.add.rectangle(640, 360, 1120, 640, 0x101c2c, 0.98).setStrokeStyle(3, 0xb8945e));
    this.text(640, 85, 'HOW TO PLAY', 38, '#f8ead0', true).setOrigin(0.5);
    this.text(640, 129, 'Move along the street and line up with enemies to land hits.', 19, '#bdc9d5').setOrigin(0.5);

    this.column(285, 'KEYBOARD', [
      ['MOVE', 'WASD / Arrow keys'], ['ATTACK', 'J'], ['JUMP', 'K'],
      ['SPECIAL', 'L  (or J + K)'], ['PAUSE', 'Esc / P']
    ]);
    this.column(640, 'TOUCH', [
      ['MOVE', 'On-screen stick'], ['ATTACK', 'ATK'], ['JUMP', 'JUMP'],
      ['SPECIAL', 'SP'], ['PAUSE', 'II button']
    ]);
    this.column(995, 'GAMEPAD', [
      ['MOVE', 'Left stick / D-pad'], ['ATTACK', 'A'], ['JUMP', 'B'],
      ['SPECIAL', 'Y'], ['PAUSE', 'Start']
    ]);
    this.text(640, 537, 'Jump + attack for a jump kick. Specials cost health when they hit.', 18, '#bdc9d5').setOrigin(0.5);
    const button = this.add(scene.add.rectangle(640, 605, 300, 58, 0x17283a).setStrokeStyle(2, 0xb8945e).setInteractive({ useHandCursor: true }));
    this.text(640, 605, 'CONTINUE', 24, '#f8ead0', true).setOrigin(0.5);
    this.text(640, 650, 'Enter / Space  •  Gamepad A or Start  •  Tap', 16, '#bdc9d5').setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x94632f));
    button.on('pointerout', () => button.setFillStyle(0x17283a));
    button.on('pointerdown', () => this.close());

    this.onKey = () => this.close();
    this.onPad = (_pad, pressed) => { if (pressed && (pressed.index === 0 || pressed.index === 9)) this.close(); };
    scene.input.keyboard?.on('keydown-ENTER', this.onKey);
    scene.input.keyboard?.on('keydown-SPACE', this.onKey);
    scene.input.gamepad?.on('down', this.onPad);
    this.onShutdown = () => this.destroy(false);
    scene.events.once('shutdown', this.onShutdown);
  }

  add(object) { this.root.add(object); return object; }

  text(x, y, content, size, color, bold = false) {
    return this.add(this.scene.add.text(x, y, content, {
      fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, color,
      fontStyle: bold ? 'bold' : 'normal'
    }));
  }

  column(x, title, rows) {
    this.add(this.scene.add.rectangle(x, 340, 320, 340, 0x17283a, 0.85).setStrokeStyle(1, 0x806943));
    this.text(x, 190, title, 22, '#e7bd76', true).setOrigin(0.5);
    rows.forEach(([label, value], i) => {
      const y = 235 + i * 56;
      this.text(x - 140, y, label, 16, '#b5c2cf', true);
      this.text(x - 140, y + 19, value, 19, '#f8ead0');
    });
  }

  close() { this.destroy(true); }

  destroy(notify) {
    if (!this.root) return;
    this.scene.input.keyboard?.off('keydown-ENTER', this.onKey);
    this.scene.input.keyboard?.off('keydown-SPACE', this.onKey);
    this.scene.input.gamepad?.off('down', this.onPad);
    this.scene.events.off('shutdown', this.onShutdown);
    this.root.destroy(true);
    this.root = null;
    if (notify) this.onClose();
  }
}
