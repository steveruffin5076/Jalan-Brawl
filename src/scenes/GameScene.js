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
import AIDirector from '../systems/AIDirector.js';
import WaveManager from '../systems/WaveManager.js';
import { drawDebug } from '../systems/DebugDraw.js';
import { createBackdrop, scrollBackdrop, streetLine } from '../systems/StageBackdrop.js';
import TouchControls from '../ui/TouchControls.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    this.rules = combat;
    this.stage = stage1;
    this.score = 0;
    this.timeMs = 0;
    this.enemyFocusMs = 0;
    this.pausedForMenu = false;
    this.clearStarted = false;
    this.goBlink = 0;
    this.goOn = true;

    this.registry.set('score', 0);
    this.registry.set('maxCombo', 0);
    this.registry.set('combo', 0);
    this.registry.set('bossActive', false);
    this.registry.set('enemyName', '');

    FLOOR.top = streetLine(stage1.backdrop);
    this.farLayer = createBackdrop(this, stage1);
    this.drawStreet();

    this.player = new Player(this, HERO_START.x, HERO_START.y, fighters.hero, combat);
    this.enemies = [];
    this.fighters = [this.player];
    this.breakables = stage1.breakables.map((item) => {
      const spec = stage1.breakableTypes[item.type];
      const y = Math.max(item.y, FLOOR.top);
      return new Breakable(this, item.x, y, spec, item.drop);
    });
    this.pickups = [];
    this.director = new AIDirector(combat);
    this.combat = new CombatSystem(this, combat);
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

  drawStreet() {
    for (const section of this.stage.sections) {
      this.add.text(section.triggerX - 360, 168, section.name, {
        fontFamily: 'sans-serif',
        fontSize: '42px',
        color: '#f4f1e8'
      }).setOrigin(0, 0.5).setDepth(-40).setAlpha(0.9);
    }
  }

  update(_time, deltaMs) {
    const delta = Math.min(deltaMs, INPUT.maxDeltaMs);
    if (Phaser.Input.Keyboard.JustDown(this.f1)) this.debugOn = !this.debugOn;
    if (this.touchControls) this.touchControls.pin();

    const input = this.inputManager.poll();
    if (input.pausePressed) {
      this.openPause();
      return;
    }

    this.applyCamera();
    this.director.reap(this.enemies);
    for (const enemy of this.enemies) {
      if (!enemy.removed) enemy.update(delta, this.director, this.player);
    }
    this.player.update(delta, input);
    if (this.player.leaving) return;
    this.combat.update(delta, this.fighters, this.breakables);
    this.director.reap(this.enemies);
    for (const prop of this.breakables) prop.tick(delta);
    for (const pickup of this.pickups) pickup.tryCollect(this.player);
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
    const stats = { ...fighters[spec.type], kind: spec.type };
    const scroll = this.flow.lockScroll;
    const left = scroll + STAGE.left;
    const right = scroll + STAGE.right;
    const x = spec.side === 'left' ? left - this.stage.spawnMargin : right + this.stage.spawnMargin;
    const y = Math.max(spec.y, FLOOR.top);
    const enemy = spec.type === 'boss1'
      ? new Boss(this, x, y, stats, this.rules, spec.side || 'right')
      : new Enemy(this, x, y, stats, this.rules, spec.side || 'right');
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
    enemy.scored = true;
    this.addScore(this.stage.koScore[enemy.kind] || 0);
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
}
