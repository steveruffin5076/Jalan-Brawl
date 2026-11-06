import { audioSettings } from '../systems/AudioSettings.js';
import Phaser from 'phaser';
import { DISPLAY, FLOOR, HERO_START, INPUT, STAGE } from '../config.js';
import fighters from '../data/fighters.json';
import combat from '../data/combat.json';
import stage1 from '../data/stage1.json';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import Breakable from '../entities/Breakable.js';
import Pickup from '../entities/Pickup.js';
import InputManager from '../systems/InputManager.js';
import { depthSort } from '../systems/DepthSort.js';
import CombatSystem from '../systems/CombatSystem.js';
import CombatAudio from '../systems/CombatAudio.js';
import AttackBoost from '../systems/AttackBoost.js';
import FlyingKick from '../systems/FlyingKick.js';
import { awardEnemyKO } from '../systems/EnemyDrops.js';
import GameplayAudio from '../systems/GameplayAudio.js';
import { fasterMovement, fasterCombat } from '../systems/GameplayPace.js';
import SceneAudio from '../systems/SceneAudio.js';
import AIDirector from '../systems/AIDirector.js';
import WaveManager from '../systems/WaveManager.js';
import { drawDebug } from '../systems/DebugDraw.js';
import { createBackdrop, scrollBackdrop, streetLine } from '../systems/StageBackdrop.js';
import TouchControls from '../ui/TouchControls.js';
import AreaBanner from '../ui/AreaBanner.js';
import MapTransition from '../systems/MapTransition.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    this.rules = fasterCombat(combat);
    this.stage = stage1;
    this.score = 0;
    this.timeMs = 0;
    this.enemyFocusMs = 0;
    this.pausedForMenu = false;
    this.clearStarted = false;
    this.goBlink = 0;
    this.goOn = true;
    this.backgroundAudio = new SceneAudio(this);
    this.backgroundAudio.setMusic('stageMusic');
    this.backgroundAudio.startAmbience();

    this.registry.set('score', 0);
    this.registry.set('maxCombo', 0);
    this.registry.set('combo', 0);
    this.registry.set('comboBonus', null);
    this.registry.set('bossActive', false);
    this.registry.set('enemyName', '');

    FLOOR.top = streetLine(stage1.backdrop);
    this.farLayer = createBackdrop(this, stage1);
    this.areaBanner = new AreaBanner(this, stage1.sections);

    this.player = new Player(this, HERO_START.x, HERO_START.y, fasterMovement(fighters.hero), this.rules);
    this.flyingKick = new FlyingKick();
    this.areaBanner.update(0, this.player.x);
    this.lastPlayerSwing = null;
    this.enemies = [];
    this.fighters = [this.player];
    this.breakables = stage1.breakables.map((item) => {
      const spec = stage1.breakableTypes[item.type];
      const y = Math.max(item.y, FLOOR.top);
      return new Breakable(this, item.x, y, spec, item.drop);
    });
    this.pickups = [];
    this.director = new AIDirector(this.rules);
    this.combatAudio = new CombatAudio(this.sound);
    this.attackBoost = new AttackBoost(combat.attackBoost, this.registry);
    this.gameplayAudio = new GameplayAudio(this.sound);
    this.combat = new CombatSystem(this, this.rules);
    this.flow = new WaveManager(stage1, {
      spawn: (spec) => this.spawnFighter(spec),
      alive: () => this.enemies.some((enemy) => enemy.state !== 'dead' && !enemy.removed),
      clearCorpses: () => this.clearCorpses(),
      onStageClear: () => this.beginStageClear()
    });

    this.cameras.main.setBounds(0, 0, stage1.worldWidth, DISPLAY.height);
    this.playfield = {
      left: STAGE.left,
      right: stage1.worldWidth - (DISPLAY.width - STAGE.right)
    };

    // Initialize map transition system
    // TEMPORARILY DISABLED FOR TESTING
    // this.mapTransition = new MapTransition(this);
    this.mapTransition = { isTransitioning: false, update: () => {} }; // Stub
    this.currentAreaIndex = 0;

    this.goText = this.add.text(1040, 360, 'GO →', {
      fontFamily: 'sans-serif',
      fontSize: '64px',
      color: '#ffe08a'
    }).setScrollFactor(0).setDepth(20).setOrigin(0.5).setVisible(false);

    this.scene.launch('HUD');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('HUD');
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.pausedForMenu = false;
    });

    this.debugOn = false;
    this.debugGfx = this.add.graphics().setDepth(5000);
    this.f1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    this.input.keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.F1);

    this.inputManager = new InputManager(this);
    if (this.sys.game.device.input.touch) {
      this.input.addPointer(3);
      this.touchControls = new TouchControls(this);
      this.inputManager.touch = this.touchControls;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.touchControls.destroy();
      });
    }

    depthSort(this.fighters);
  }

  update(_time, deltaMs) {
    const delta = Math.min(deltaMs, INPUT.maxDeltaMs);
    if (Phaser.Input.Keyboard.JustDown(this.f1)) this.debugOn = !this.debugOn;
    if (this.touchControls) this.touchControls.pin();

    // Update map transition state each frame
    this.mapTransition.update(delta);

    const input = this.inputManager.poll();
    if (input.pausePressed) {
      this.openPause();
      return;
    }

    this.applyCamera();
    this.director.reap(this.enemies);
    for (const enemy of this.enemies) {
      if (enemy.removed) continue;
      const previousAI = enemy.ai;
      const wasLying = enemy.lying;
      enemy.update(delta, this.director, this.player);
      this.combatAudio.enemyUpdate(enemy, previousAI);
      this.combatAudio.landing(enemy, wasLying);
    }
    const playerWasLying = this.player.lying;
    const playerBefore = { state: this.player.state, z: this.player.z };
    const playerWasFrozen = this.player.hitstopMs > 0;
    this.player.update(delta, input);
    this.flyingKick.update(this.player, delta, playerWasFrozen);
    if (this.player.state === 'dead' || this.player.leaving) this.attackBoost.clear();
    else this.attackBoost.tick(delta);
    this.areaBanner.update(delta, this.player.x);
    this.gameplayAudio.movement(playerBefore, this.player);
    this.combatAudio.landing(this.player, playerWasLying);
    this.playPlayerSwing();
    if (this.player.leaving) return;

    // Check for map area transition
    // TEMPORARILY DISABLED TO TEST IF THIS IS THE FREEZE CAUSE
    if (false && !this.mapTransition.isTransitioning && this.stage.sections) {
      if (this.timeMs % 2000 < 16) {
        console.log(`[TRANSITION-CHECK] Player X: ${this.player.x}, currentAreaIndex: ${this.currentAreaIndex}, hasStage: ${!!this.stage}, sectionsCount: ${this.stage.sections.length}`);
      }
      
      const nextSection = this.mapTransition.checkAreaTransition(this.player.x, this.stage.sections, this.currentAreaIndex);
      if (nextSection) {
        console.log(`[TRANSITION] ⚠️ TRANSITION TRIGGERED at playerX=${this.player.x}`);
        console.log(`[TRANSITION] From: ${this.stage.sections[this.currentAreaIndex].id} → To: ${nextSection.id}`);
        this.mapTransition.transitionToArea(nextSection.id, (nextAreaId) => {
          console.log(`[TRANSITION] CALLBACK STARTED for ${nextAreaId}`);
          this.unloadArea();
          this.loadArea(nextAreaId);
          console.log(`[TRANSITION] ✓ CALLBACK COMPLETE: now in ${nextAreaId}`);
        });
      }
    }

    this.combat.update(delta, this.fighters, this.breakables);
    if (this.player.state === 'dead') this.attackBoost.clear();
    this.director.reap(this.enemies);
    for (const prop of this.breakables) prop.tick(delta);
    for (const pickup of this.pickups) {
      const wasTaken = pickup.taken;
      pickup.tryCollect(this.player);
      this.gameplayAudio.pickup(pickup, wasTaken);
    }
    for (const enemy of this.enemies) this.awardKo(enemy);

    this.flow.update(delta, this.player);
    if (this.clearStarted) return;
    this.applyCamera();

    for (const fighter of this.fighters) {
      if (!fighter.removed) fighter.clamp();
    }
    this.timeMs += delta;
    this.tickFocus(delta);
    this.tickBossBar();
    this.tickGo(delta);
    depthSort(this.fighters);
    drawDebug(this.debugGfx, this.fighters, this.rules, this.debugOn, this.breakables);
  }

  playPlayerSwing() {
    const attack = this.player.attack;
    if (attack && attack !== this.lastPlayerSwing) {
      const sounds = {
        jab1: 'jab', jab2: 'jab', hook: 'hook', kick: 'kick',
        jumpKick: 'jump-kick', special: 'special'
      };
      const sound = sounds[attack.anim];
      if (sound) this.sound.play(`heroSwing-${sound}`, { volume: 0.7 * audioSettings.values.effects });
    }
    this.lastPlayerSwing = attack;
  }

  applyCamera() {
    const camera = this.cameras.main;
    const maxScroll = Math.max(0, this.stage.worldWidth - DISPLAY.width);
    if (this.flow.locked) {
      camera.scrollX = this.flow.lockScroll;
    } else {
      camera.scrollX = Phaser.Math.Clamp(this.player.x - DISPLAY.width / 2, 0, maxScroll);
    }
    const scroll = camera.scrollX;
    if (this.farLayer) scrollBackdrop(this.farLayer, scroll, this.stage.backdrop);
    if (this.flow.locked) {
      this.playfield = { left: scroll + STAGE.left, right: scroll + STAGE.right };
    } else {
      this.playfield = {
        left: STAGE.left,
        right: this.stage.worldWidth - (DISPLAY.width - STAGE.right)
      };
    }
    this.director.setBounds(this.playfield.left, this.playfield.right);
  }

  spawnFighter(spec) {
    if (spec.type === 'boss1') this.backgroundAudio.setMusic('bossMusic');
    const stats = { ...fasterMovement(fighters[spec.type]), kind: spec.type };
    const scroll = this.flow.lockScroll;
    const left = scroll + STAGE.left;
    const right = scroll + STAGE.right;
    const x = spec.side === 'left' ? left - this.stage.spawnMargin : right + this.stage.spawnMargin;
    const y = Math.max(spec.y, FLOOR.top);
    const enemy = spec.type === 'boss1'
      ? new Boss(this, x, y, stats, this.rules, spec.side || 'right')
      : new Enemy(this, x, y, stats, this.rules, spec.side || 'right');
    // Keep the enemy's name for the HUD, but remove the floating world label.
    if (enemy.label) {
      enemy.label.destroy();
      enemy.label = null;
    }
    this.enemies.push(enemy);
    this.fighters.push(enemy);
  }

  spawnBackup() {
    const section = this.stage.sections[this.flow.sectionIndex];
    for (const spec of section.backup || []) this.spawnFighter(spec);
  }

  clearCorpses() {
    for (const enemy of this.enemies) {
      if (enemy.state !== 'dead') continue;
      this.director.release(enemy);
      enemy.dismiss();
    }
    this.enemies = this.enemies.filter((enemy) => !enemy.removed);
    this.fighters = [this.player, ...this.enemies];
  }

  awardKo(enemy) {
    if (enemy.scored || enemy.state !== 'dead') return;
    awardEnemyKO(enemy, this.stage, {
      score: amount => this.addScore(amount),
      drop: (fighter, item) => {
        const x = Phaser.Math.Clamp(fighter.x, this.playfield.left, this.playfield.right);
        const y = Phaser.Math.Clamp(fighter.y, FLOOR.top, FLOOR.bottom);
        this.dropPickup(x, y, item);
      }
    });
  }

  addScore(amount) {
    this.score += amount;
    this.registry.set('score', this.score);
  }

  dropPickup(x, y, id) {
    const spec = this.stage.pickupTypes[id];
    if (!spec) return;
    this.pickups.push(new Pickup(this, x, y, spec));
  }

  spawnAnchor() {
    const scroll = this.cameras.main.scrollX;
    return {
      x: Phaser.Math.Clamp(scroll + 220, this.playfield.left + 40, this.playfield.right - 80),
      y: HERO_START.y
    };
  }

  openPause() {
    if (this.pausedForMenu || this.clearStarted || this.player.leaving) return;
    this.pausedForMenu = true;
    this.scene.launch('Pause');
    this.scene.pause();
  }

  beginStageClear() {
    if (this.clearStarted) return;
    this.clearStarted = true;
    this.registry.set('timeMs', Math.floor(this.timeMs));
    this.registry.set('score', this.score);
    this.scene.start('StageClear');
  }

  tickFocus(delta) {
    if (this.enemyFocusMs <= 0) return;
    this.enemyFocusMs -= delta;
    if (this.enemyFocusMs <= 0) this.registry.set('enemyName', '');
  }

  tickBossBar() {
    const boss = this.enemies.find((enemy) => enemy.kind === 'boss1' && enemy.state !== 'dead' && !enemy.removed);
    this.registry.set('bossActive', !!boss);
    if (!boss) return;
    this.registry.set('bossHp', boss.hp);
    this.registry.set('bossMaxHp', boss.maxHp);
  }

  tickGo(delta) {
    if (!this.flow.showGo) {
      this.goText.setVisible(false);
      return;
    }
    this.goBlink += delta;
    if (this.goBlink >= this.stage.goBlinkMs) {
      this.goBlink = 0;
      this.goOn = !this.goOn;
    }
    this.goText.setVisible(this.goOn);
  }

  /**
   * Unload current map area - clear enemies, breakables, and pickups
   */
  unloadArea() {
    try {
      console.log('[TRANSITION-UNLOAD] Starting unloadArea...');
      
      // Pause enemies and halt wave manager
      console.log(`[TRANSITION-UNLOAD] Dismissing ${this.enemies.length} enemies`);
      for (const enemy of this.enemies) {
        if (!enemy.removed) {
          try {
            enemy.dismiss();
          } catch (e) {
            console.error(`[TRANSITION-UNLOAD] Error dismissing enemy:`, e.message);
          }
        }
      }
      this.enemies = [];
      console.log('[TRANSITION-UNLOAD] Enemies cleared');
      
      this.fighters = [this.player];
      console.log('[TRANSITION-UNLOAD] Fighters reset to player only');

      // Clear breakables and pickups
      console.log(`[TRANSITION-UNLOAD] Destroying ${this.breakables.length} breakables`);
      for (const breakable of this.breakables) {
        try {
          breakable.destroy();
        } catch (e) {
          console.error(`[TRANSITION-UNLOAD] Error destroying breakable:`, e.message);
        }
      }
      this.breakables = [];
      console.log('[TRANSITION-UNLOAD] Breakables cleared');

      console.log(`[TRANSITION-UNLOAD] Destroying ${this.pickups.length} pickups`);
      for (const pickup of this.pickups) {
        try {
          pickup.destroy();
        } catch (e) {
          console.error(`[TRANSITION-UNLOAD] Error destroying pickup:`, e.message);
        }
      }
      this.pickups = [];
      console.log('[TRANSITION-UNLOAD] Pickups cleared');

      // Reset director
      console.log('[TRANSITION-UNLOAD] Resetting director');
      this.director.reset();
      console.log('[TRANSITION-UNLOAD] COMPLETE');
    } catch (error) {
      console.error('[TRANSITION-UNLOAD] CRITICAL ERROR:', error.message, error.stack);
    }
  }

  /**
   * Load a new map area by ID
   * @param {string} areaId - The area ID to load (e.g., 'pasar', 'shophouse')
   */
  loadArea(areaId) {
    try {
      console.log(`[TRANSITION-LOAD] Starting loadArea for: ${areaId}`);
      
      const sectionIndex = this.stage.sections.findIndex((s) => s.id === areaId);
      if (sectionIndex === -1) {
        console.error(`[TRANSITION-LOAD] Area not found: ${areaId}`);
        return;
      }
      console.log(`[TRANSITION-LOAD] Found section at index ${sectionIndex}`);

      this.currentAreaIndex = sectionIndex;
      const section = this.stage.sections[sectionIndex];
      console.log(`[TRANSITION-LOAD] Set currentAreaIndex to ${sectionIndex}`);

      // Reset wave manager to this section for fresh wave spawning
      console.log(`[TRANSITION-LOAD] Calling flow.reset(${sectionIndex})`);
      this.flow.reset(sectionIndex);
      console.log('[TRANSITION-LOAD] Wave manager reset complete');

      // Update area banner
      console.log('[TRANSITION-LOAD] Updating area banner');
      this.areaBanner.update(0, this.player.x);
      console.log('[TRANSITION-LOAD] COMPLETE');
    } catch (error) {
      console.error('[TRANSITION-LOAD] CRITICAL ERROR:', error.message, error.stack);
    }
  }
}
