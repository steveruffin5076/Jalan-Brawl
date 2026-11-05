import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioSettings, audioSettings } from '../src/systems/AudioSettings.js';
import SceneAudio from '../src/systems/SceneAudio.js';
import CombatAudio from '../src/systems/CombatAudio.js';
import { wireMenuSounds } from '../src/ui/MenuSounds.js';
import { EventEmitter } from 'node:events';

function storage(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

test('settings persist, validate input, clamp values and unsubscribe listeners', () => {
  const saved = storage();
  const settings = new AudioSettings(saved);
  assert.deepEqual(settings.values, { music: 1, effects: 1, ambience: 1, muted: false });
  let calls = 0;
  const unsubscribe = settings.subscribe(() => calls++);
  settings.set('music', 0.35);
  settings.set('ambience', 4);
  settings.set('effects', -2);
  settings.set('muted', true);
  settings.set('effects', NaN);
  settings.set('unknown', 1);
  unsubscribe();
  settings.set('music', 0.4);
  assert.equal(calls, 3); // unchanged ambience is not broadcast
  assert.deepEqual(new AudioSettings(saved).values, { music: 0.4, effects: 0, ambience: 1, muted: true });
});

test('bad or unavailable storage does not prevent settings from working', () => {
  const broken = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const settings = new AudioSettings(broken);
  settings.set('effects', 0.2);
  assert.equal(settings.values.effects, 0.2);
  assert.equal(new AudioSettings(storage('{invalid')).values.music, 1);
  assert.deepEqual(new AudioSettings(storage('{"music":-2,"effects":"bad","muted":"yes"}')).values,
    { music: 0, effects: 1, ambience: 1, muted: false });
});

test('music and ambience update live, including paused loops and boss track', () => {
  const events = new EventEmitter();
  const sounds = [];
  const scene = { events, sound: { add(key, config) {
    const item = { key, volume: config.volume, isPlaying: false, isPaused: false,
      play() { this.isPlaying = true; }, pause() { this.isPaused = true; this.isPlaying = false; },
      resume() { this.isPaused = false; this.isPlaying = true; }, stop() {}, destroy() {} };
    sounds.push(item); return item;
  } } };
  const audio = new SceneAudio(scene);
  try {
    audio.setMusic('stageMusic'); audio.startAmbience(); audio.pause();
    audioSettings.set('music', 0.4); audioSettings.set('ambience', 0.2);
    assert.equal(sounds[0].volume, 0.1);
    assert.equal(sounds[1].volume, 0.13);
    audio.setMusic('bossMusic');
    assert.equal(sounds[2].volume, 0.1);
  } finally {
    audio.dispose(); audioSettings.set('music', 1); audioSettings.set('ambience', 1);
  }
});

test('menu and combat effects respect effects slider', () => {
  const played = [];
  const sound = { play: (key, config) => played.push([key, config.volume]) };
  const button = new EventEmitter(); button.setFillStyle = () => {};
  try {
    audioSettings.set('effects', 0.5);
    new CombatAudio(sound).play('hit-light');
    wireMenuSounds({ sound }, button, () => {});
    button.emit('pointerdown');
    assert.deepEqual(played, [['combat-hit-light', 0.35], ['menuConfirm', 0.3]]);
  } finally { audioSettings.set('effects', 1); }
});

test('settings panel supports pointer dragging, mute and cleanup', async () => {
  const { default: AudioSettingsPanel } = await import('../src/ui/AudioSettingsPanel.js');
  class Item extends EventEmitter {
    constructor(x = 0) { super(); this.x = x; this.children = []; }
    setDepth() { return this; } setInteractive() { return this; } setStrokeStyle() { return this; }
    setOrigin() { return this; } setScale(x, y) { this.scaleX = x; this.scaleY = y; return this; }
    setFillStyle() { return this; } setText(t) { this.text = t; return this; }
    add(item) { this.children.push(item); return this; } destroy() { this.destroyed = true; }
  }
  const input = new EventEmitter();
  const scene = { input, events: new EventEmitter(), sound: { mute: false }, add: {
    container: () => new Item(), rectangle: x => new Item(x), circle: x => new Item(x), text: x => new Item(x)
  } };
  let closed = 0;
  const panel = new AudioSettingsPanel(scene, () => closed++);
  try {
    const sliderTarget = panel.root.children.find(item => item.listenerCount('pointerdown') && item.x === 715);
    sliderTarget.emit('pointerdown', { id: 1, x: 715 });
    assert.equal(audioSettings.values.music, 0.5);
    input.emit('pointermove', { id: 1, x: 865, isDown: true });
    assert.equal(audioSettings.values.music, 1);
    const muteButton = panel.root.children.find(item => item.listenerCount('pointerdown') && item.x === 490);
    muteButton.emit('pointerdown');
    assert.equal(audioSettings.values.muted, true);
    assert.equal(scene.sound.mute, true);
    panel.close();
    assert.equal(closed, 1);
    assert.equal(input.listenerCount('pointermove'), 0);
  } finally {
    if (panel.root) panel.close();
    audioSettings.set('music', 1); audioSettings.set('muted', false);
  }
});
