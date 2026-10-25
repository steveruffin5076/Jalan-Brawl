import Phaser from 'phaser';
import { DISPLAY } from '../config.js';
import fighters from '../data/fighters.json';
import atlasIndex from '../data/atlas-index.json';
import { frameNames, poseOffset, sequenceIndex } from '../systems/HeroAnims.js';

const FEET = { x: 640, y: 580 };
const VIEW_SCALE = 1.5;

/** Dev player for an atlas. Open with ?preview=1. Not on the title menu. */
export default class AnimPreviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AnimPreview' });
  }

  preload() {
    this.chars = atlasIndex;
    for (const char of atlasIndex) {
      this.load.image(`${char}Image`, `assets/atlases/${char}.png`);
      this.load.json(`${char}Atlas`, `assets/atlases/${char}.json`);
      this.load.json(`${char}Meta`, `assets/atlases/${char}.meta.json`);
    }
  }

  create() {
    const ready = (this.chars || []).filter((char) => (
      this.textures.exists(`${char}Image`) && this.cache.json.exists(`${char}Atlas`)
    ));
    if (!ready.length) {
      this.add.text(DISPLAY.width / 2, DISPLAY.height / 2, 'No atlas yet. Run npm run art.', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#f4f1e8'
      }).setOrigin(0.5);
      return;
    }
    for (const char of ready) {
      const atlas = this.cache.json.get(`${char}Atlas`);
      this.textures.addAtlas(char, this.textures.get(`${char}Image`).getSourceImage(), atlas);
    }
    this.chars = ready;
    this.build();
  }

  build() {
    this.charIndex = 0;
    this.animIndex = 0;
    this.playing = true;
    this.rate = 1;
    this.drawGrid();

    this.view = this.add.container(FEET.x, FEET.y).setScale(VIEW_SCALE);
    this.sprite = this.add.sprite(0, 0, this.chars[0], 0);
    this.overlay = this.add.graphics();
    this.view.add([this.sprite, this.overlay]);

    this.title = this.add.text(DISPLAY.width / 2, 28, '', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#f4f1e8'
    }).setOrigin(0.5);
    this.frameText = this.add.text(DISPLAY.width / 2, 68, '', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#9eb0c8'
    }).setOrigin(0.5);
    this.hint = this.add.text(24, 68, 'Arrows pick a clip\nSpace plays', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#9eb0c8'
    });

    this.playButton = this.makeButton(300, 660, 'Pause', () => this.togglePlay());
    this.makeButton(520, 660, 'Step', () => this.stepFrame());
    this.slowButton = this.makeButton(760, 660, '0.25×', () => this.setRate(0.25));
    this.normalButton = this.makeButton(1000, 660, '1×', () => this.setRate(1));
    this.paintRates();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.showAnim();
  }

  update() {
    if (!this.sprite) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.shiftAnim(-1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.shiftAnim(1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.shiftChar(-1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.shiftChar(1);
    if (Phaser.Input.Keyboard.JustDown(this.space)) this.togglePlay();
    this.applyPose();
    this.drawOverlay();
    const total = this.sprite.anims.getTotalFrames();
    const index = sequenceIndex(this.sprite.anims.currentFrame);
    this.frameText.setText(`Frame ${index + 1} / ${total}`);
  }

  drawGrid() {
    const grid = this.add.graphics().setDepth(-10);
    grid.lineStyle(1, 0x2a3c52, 1);
    for (let x = 0; x <= DISPLAY.width; x += 40) grid.lineBetween(x, 0, x, DISPLAY.height);
    for (let y = 0; y <= DISPLAY.height; y += 40) grid.lineBetween(0, y, DISPLAY.width, y);
    grid.lineStyle(2, 0xff2a2a, 1);
    grid.lineBetween(0, FEET.y, DISPLAY.width, FEET.y);
    grid.lineBetween(FEET.x, FEET.y - 220, FEET.x, FEET.y + 24);
    this.add.circle(FEET.x, FEET.y, 5, 0xffe08a).setDepth(5);
  }

  animNames(char) {
    const texture = this.textures.get(char);
    const groups = new Map();
    for (const name of texture.getFrameNames()) {
      if (name === '__BASE') continue;
      const match = name.match(new RegExp(`^${char}_(.+)_(\\d+)$`));
      if (!match) continue;
      if (!groups.has(match[1])) groups.set(match[1], []);
      groups.get(match[1]).push({ name, index: Number(match[2]) });
    }
    return [...groups.keys()].sort();
  }

  showAnim() {
    const char = this.chars[this.charIndex];
    const names = this.animNames(char);
    if (!names.length) return;
    this.animIndex = Phaser.Math.Wrap(this.animIndex, 0, names.length);
    const anim = names[this.animIndex];
    const meta = this.cache.json.get(`${char}Meta`);
    const spec = meta && meta.anims[anim] ? meta.anims[anim] : { frames: 1, fps: 8 };
    const owners = clipAttacks(char, anim);
    const sliced = owners.length === 1 && owners[0].frameOrder ? owners[0] : null;
    const fps = owners.length === 1 ? previewFps(owners[0], spec) : spec.fps;
    const frames = frameNames(char, anim, spec, sliced);
    this.previewOrder = sliced ? sliced.frameOrder : null;
    this.currentAnim = anim;
    this.sprite.setTexture(char, frames[0]);
    const key = `${char}:${anim}`;
    if (!this.anims.exists(key)) {
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: char, frame })),
        frameRate: fps,
        repeat: -1
      });
    }
    this.sprite.play(key);
    this.sprite.anims.timeScale = this.rate;
    if (!this.playing) this.sprite.anims.pause();
    this.hurtbox = fighters[char] ? fighters[char].hurtbox : null;
    this.title.setText(`${char}  ${anim}`);
    this.playButton.setText(this.playing ? 'Pause' : 'Play');
  }

  applyPose() {
    const char = this.chars[this.charIndex];
    const offsets = fighters[char] && fighters[char].pose && fighters[char].pose[this.currentAnim];
    this.sprite.x = poseOffset(offsets, this.sprite.anims.currentFrame);
  }

  drawOverlay() {
    this.overlay.clear();
    if (this.hurtbox) {
      this.overlay.lineStyle(2, 0x3dff6a, 1);
      this.overlay.strokeRect(-this.hurtbox.w / 2, -this.hurtbox.h, this.hurtbox.w, this.hurtbox.h);
    }
    const played = sequenceIndex(this.sprite.anims.currentFrame);
    const index = this.previewOrder ? this.previewOrder[played] : played;
    const hit = attackForFrame(this.chars[this.charIndex], this.currentAnim, index);
    if (!hit) return;
    const box = hit.attack.hitbox;
    this.overlay.lineStyle(hit.active ? 4 : 2, 0xff4d4d, hit.active ? 1 : 0.45);
    this.overlay.strokeRect(box.x, box.y, box.w, box.h);
  }

  shiftAnim(step) {
    this.animIndex += step;
    this.showAnim();
  }

  shiftChar(step) {
    this.charIndex = Phaser.Math.Wrap(this.charIndex + step, 0, this.chars.length);
    this.animIndex = 0;
    this.showAnim();
  }

  togglePlay() {
    this.playing = !this.playing;
    if (this.playing) this.sprite.anims.resume();
    else this.sprite.anims.pause();
    this.playButton.setText(this.playing ? 'Pause' : 'Play');
  }

  stepFrame() {
    this.playing = false;
    this.sprite.anims.pause();
    const anim = this.sprite.anims;
    const frames = anim.currentAnim.frames;
    const next = (sequenceIndex(anim.currentFrame) + 1) % frames.length;
    anim.setCurrentFrame(frames[next]);
    this.playButton.setText('Play');
  }

  setRate(rate) {
    this.rate = rate;
    this.sprite.anims.timeScale = rate;
    this.paintRates();
  }

  paintRates() {
    this.slowButton.setColor(this.rate === 0.25 ? '#ffe08a' : '#ffffff');
    this.normalButton.setColor(this.rate === 1 ? '#ffe08a' : '#ffffff');
  }

  makeButton(x, y, label, onPress) {
    const bg = this.add.rectangle(x, y, 200, 72, 0x1e3a5f).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x2a5080));
    bg.on('pointerout', () => bg.setFillStyle(0x1e3a5f));
    bg.on('pointerdown', onPress);
    return text;
  }
}

function clipAttacks(char, anim) {
  const stats = fighters[char];
  if (!stats || !stats.attacks) return [];
  return Object.values(stats.attacks).filter((attack) => (attack.clip || attack.anim) === anim);
}

function previewFps(attack, spec) {
  if (attack.holdFrame != null || attack.loopAnim || attack.frameOrder) return spec.fps;
  return attack.fps;
}

function attackForFrame(char, anim, frameIndex) {
  const list = clipAttacks(char, anim);
  for (const attack of list) {
    if (!attack.frameOrder) continue;
    const pos = attack.frameOrder.indexOf(frameIndex);
    if (pos === -1) continue;
    return { attack, active: attack.activeFrames.includes(pos) };
  }
  const whole = list.find((attack) => !attack.frameOrder);
  if (!whole) return null;
  if (whole.showFrames) {
    if (!whole.showFrames.includes(frameIndex)) return null;
    return { attack: whole, active: true };
  }
  if (whole.loopAnim) return { attack: whole, active: true };
  return { attack: whole, active: whole.activeFrames.includes(frameIndex) };
}
