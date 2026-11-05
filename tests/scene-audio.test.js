import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import SceneAudio from '../src/systems/SceneAudio.js';
import { wireMenuSounds } from '../src/ui/MenuSounds.js';

// Minimal emitter with Phaser's optional listener context.
class Events {
  constructor() { this.listeners = []; }
  on(event, fn, context) { this.listeners.push({ event, fn, context, once: false }); }
  once(event, fn, context) { this.listeners.push({ event, fn, context, once: true }); }
  off(event, fn, context) { this.listeners = this.listeners.filter(x => x.event !== event || x.fn !== fn || x.context !== context); }
  emit(event) { for (const x of [...this.listeners]) if (x.event === event) { if (x.once) this.off(x.event, x.fn, x.context); x.fn.call(x.context); } }
}
function soundStub() {
  const made = [];
  return { made, add(key, config) {
    const s = { key, config, isPlaying: false, isPaused: false, destroyed: false,
      play() { this.isPlaying = true; }, pause() { this.isPlaying = false; this.isPaused = true; },
      resume() { this.isPaused = false; this.isPlaying = true; },
      stop() { this.isPlaying = false; this.isPaused = false; }, destroy() { this.destroyed = true; } };
    made.push(s); return s;
  } };
}

test('scene loops switch at boss, pause and resume, and clean up on exit', () => {
  const sound = soundStub(); const events = new Events();
  const audio = new SceneAudio({ sound, events });
  audio.setMusic('stageMusic'); audio.setMusic('stageMusic'); audio.startAmbience(); audio.startAmbience();
  assert.equal(sound.made.length, 2);
  assert.equal(sound.made[0].config.loop, true);
  events.emit('pause'); assert.equal(sound.made[0].isPaused, true); assert.equal(sound.made[1].isPaused, true);
  events.emit('resume'); assert.equal(sound.made[0].isPlaying, true);
  audio.setMusic('bossMusic'); assert.equal(sound.made[0].destroyed, true);
  assert.equal(sound.made[2].key, 'bossMusic');
  events.emit('shutdown'); assert.equal(sound.made[1].destroyed, true); assert.equal(sound.made[2].destroyed, true);
  assert.equal(events.listeners.length, 0);
});

test('menu hover and confirm play once and keep the original callback', () => {
  const played = []; let presses = 0; const button = new EventEmitter();
  button.setFillStyle = color => { button.fill = color; };
  wireMenuSounds({ sound: { play: key => played.push(key) } }, button, () => presses++);
  button.emit('pointerover'); assert.equal(button.fill, 0x2a5080);
  button.emit('pointerout'); assert.equal(button.fill, 0x1e3a5f);
  button.emit('pointerdown'); assert.equal(presses, 1);
  assert.deepEqual(played, ['menuHover', 'menuConfirm']);
});
