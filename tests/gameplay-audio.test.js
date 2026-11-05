import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import GameplayAudio, { playResultCue } from '../src/systems/GameplayAudio.js';
import { audioSettings } from '../src/systems/AudioSettings.js';

function setup() {
  const calls = [];
  const audio = new GameplayAudio({ play: (key, config) => calls.push([key, config.volume]) });
  return { audio, calls };
}

test('jump and landing cues follow actual jump transitions, not hits or knockdowns', () => {
  const { audio, calls } = setup();
  audio.movement({ state: 'idle', z: 0 }, { state: 'jump', z: 0 });
  audio.movement({ state: 'jump', z: 0 }, { state: 'jump', z: 15 });
  audio.movement({ state: 'jump', z: 15 }, { state: 'jumpAttack', z: 30 });
  audio.movement({ state: 'jumpAttack', z: 8 }, { state: 'idle', z: 0 });
  audio.movement({ state: 'knockdown', z: 10 }, { state: 'knockdown', z: 0 });
  audio.movement({ state: 'jump', z: 10 }, { state: 'hurt', z: 0 });
  assert.deepEqual(calls.map(x => x[0]), ['gameplay-jump', 'gameplay-landing']);
});

test('pickup cues play once for actual food and cash collection', () => {
  const { audio, calls } = setup();
  audio.pickup({ taken: false, spec: { image: 'cash' } }, false);
  audio.pickup({ taken: true, spec: { image: 'cash' } }, false);
  audio.pickup({ taken: true, spec: { image: 'cash' } }, true);
  audio.pickup({ taken: true, spec: { image: 'tehtarik' } }, false);
  audio.pickup({ taken: true, spec: { image: 'nasilemak' } }, false);
  assert.deepEqual(calls.map(x => x[0]), ['gameplay-pickup-cash', 'gameplay-pickup-food', 'gameplay-pickup-food']);
});

test('cues respect effects volume, results stop when their scene shuts down', () => {
  const { audio, calls } = setup();
  const events = new EventEmitter();
  const played = [];
  const result = { play: () => played.push('play'), stop: () => played.push('stop'), destroy: () => played.push('destroy') };
  const scene = { events, sound: { add: (key, config) => { calls.push([key, config.volume]); return result; } } };
  try {
    audioSettings.set('effects', 0.5);
    audio.play('jump', 0.6);
    playResultCue(scene, 'stage-clear');
    assert.deepEqual(calls, [['gameplay-jump', 0.3], ['gameplay-stage-clear', 0.35]]);
    assert.deepEqual(played, ['play']);
    events.emit('shutdown');
    events.emit('shutdown');
    assert.deepEqual(played, ['play', 'stop', 'destroy']);
  } finally { audioSettings.set('effects', 1); }
});
