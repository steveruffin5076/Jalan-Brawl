import Phaser from 'phaser';
import { DISPLAY } from '../config.js';

/**
 * Walks the stage left to right. Crossing a trigger freezes the camera,
 * because the fight has to stay on one screen until that section is empty.
 */
export default class WaveManager {
  constructor(stage, handlers) {
    this.stage = stage;
    this.handlers = handlers;
    this.sectionIndex = 0;
    this.waveIndex = 0;
    this.locked = false;
    this.lockScroll = 0;
    this.waveLive = false;
    this.waiting = false;
    this.waitMs = 0;
    this.showGo = false;
    this.pendingClear = false;
    this.clearMs = 0;
    this.clearFired = false;
  }

  update(delta, player) {
    if (this.pendingClear) {
      if (this.clearFired) return;
      this.clearMs -= delta;
      if (this.clearMs <= 0) {
        this.clearFired = true;
        this.handlers.onStageClear();
      }
      return;
    }

    const section = this.stage.sections[this.sectionIndex];
    if (!section) return;

    if (!this.locked && player.state !== 'dead' && player.x >= section.triggerX) {
      this.lock(section, player);
    }

    if (this.waiting) {
      this.waitMs -= delta;
      if (this.waitMs <= 0) {
        this.waiting = false;
        this.handlers.clearCorpses();
        this.spawnWave(section);
        this.waveLive = true;
      }
    }

    if (this.locked && this.waveLive && !this.handlers.alive()) {
      this.waveLive = false;
      this.onWaveCleared(section);
    }
  }

  lock(section, player) {
    const maxScroll = Math.max(0, this.stage.worldWidth - DISPLAY.width);
    this.lockScroll = Phaser.Math.Clamp(player.x - DISPLAY.width / 2, 0, maxScroll);
    this.locked = true;
    this.waveIndex = 0;
    this.showGo = false;
    if (section.boss) {
      this.handlers.spawn({ type: section.boss, side: 'right', y: section.bossY });
      this.waveLive = true;
      return;
    }
    this.spawnWave(section);
    this.waveLive = true;
  }

  spawnWave(section) {
    const wave = section.waves[this.waveIndex] || [];
    for (const spec of wave) this.handlers.spawn(spec);
    this.waveIndex += 1;
  }

  onWaveCleared(section) {
    if (this.waveIndex < section.waves.length) {
      this.waiting = true;
      this.waitMs = this.stage.waveGapMs;
      return;
    }
    if (this.sectionIndex >= this.stage.sections.length - 1) {
      this.pendingClear = true;
      this.clearMs = this.stage.stageClearDelayMs;
      this.showGo = false;
      return;
    }
    this.handlers.clearCorpses();
    this.locked = false;
    this.sectionIndex += 1;
    this.waveIndex = 0;
    this.showGo = true;
  }
}
