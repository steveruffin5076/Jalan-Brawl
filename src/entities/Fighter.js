import Phaser from 'phaser';
import { FLOOR, SHADOW, STAGE } from '../config.js';
import HeroView from '../systems/HeroView.js';

/**
 * Feet sit at (x, y). The container's local (0, 0) is that point.
 * A fighter with a loaded atlas uses that art. Anyone else stays a colored block.
 */
export default class Fighter {
  constructor(scene, x, y, options) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vz = 0;
    this.vx = 0;
    this.facing = 1;
    this.state = 'idle';
    this.bodySize = options.body;
    this.hp = options.hp;
    this.maxHp = options.hp;
    this.hurtbox = options.hurtbox;
    this.gravity = options.gravity;
    this.rules = options.rules;
    this.isPlayer = !!options.isPlayer;

    this.hitstopMs = 0;
    this.flashMs = 0;
    this.invulnMs = 0;
    this.blinkMs = 0;
    this.blinkOn = true;
    this.hurtMs = 0;
    this.lieMs = 0;
    this.lying = false;
    this.fallMs = 0;
    this.hurtElapsed = 0;
    this.stateMs = 0;
    this.deadMs = 0;
    this.struck = new Set();
    this.attack = null;
    this.attackElapsed = 0;
    this.attackConnected = false;
    this.attackBuffered = false;
    this.hpCostPaid = false;
    this.hitSet = new Set();
    this.crouch = false;
    this.superArmor = !!options.superArmor;
    this.entered = options.entered !== false;
    this.name = options.name || '';
    this.removed = false;

    const body = options.body;
    const shadowW = body.w * 0.95;
    this.shadow = scene.add.ellipse(x, y, shadowW, SHADOW.height, 0x000000, 0.4);

    this.sprite = scene.add.container(x, y);
    this.heroView = null;
    this.flashGfx = null;
    this.arm = null;
    if (options.atlas && scene.textures.exists(options.atlas)) {
      this.heroView = new HeroView(scene, options);
      this.heroView.attach(this.sprite);
    } else {
      const color = Phaser.Display.Color.HexStringToColor(body.color).color;
      const gfx = scene.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillRoundedRect(-body.w / 2, -body.h, body.w, body.h, 14);
      gfx.fillStyle(0xffffff, 1);
      const noseY = -body.h * 0.62;
      gfx.fillTriangle(
        body.w / 2 - 6, noseY - 12,
        body.w / 2 + 16, noseY,
        body.w / 2 - 6, noseY + 12
      );
      this.sprite.add(gfx);

      this.flashGfx = scene.add.graphics();
      this.flashGfx.fillStyle(0xffffff, 0.9);
      this.flashGfx.fillRoundedRect(-body.w / 2, -body.h, body.w, body.h, 14);
      this.flashGfx.setVisible(false);
      this.sprite.add(this.flashGfx);

      this.arm = scene.add.rectangle(0, 0, 20, 16, 0xffe08a, 1);
      this.arm.setVisible(false);
      this.sprite.add(this.arm);
    }

    if (options.name) {
      this.label = scene.add.text(x, y, options.name, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f4f1e8'
      }).setOrigin(0.5, 1);
    }

    this.syncView();
  }

  /** Frozen fighters skip movement so hitstop is the same length at any frame rate. */
  tick(delta) {
    this.flashMs = Math.max(0, this.flashMs - delta);
    if (this.invulnMs > 0) {
      this.invulnMs -= delta;
      this.blinkMs += delta;
      if (this.blinkMs >= this.rules.blinkMs) {
        this.blinkMs = 0;
        this.blinkOn = !this.blinkOn;
      }
    } else {
      this.blinkOn = true;
      this.blinkMs = 0;
    }

    if (this.hitstopMs > 0) {
      this.hitstopMs -= delta;
      return 'frozen';
    }

    const dt = delta / 1000;

    if (this.state === 'hurt') {
      this.hurtElapsed += delta;
      this.hurtMs -= delta;
      if (this.hurtMs <= 0) this.state = this.hp <= 0 ? 'dead' : 'idle';
      return 'busy';
    }

    if (this.state === 'knockdown') {
      if (!this.lying) {
        this.fallMs += delta;
        this.x += this.vx * dt;
        this.z += this.vz * dt;
        this.vz -= this.gravity * dt;
        if (this.z <= 0) {
          this.z = 0;
          this.vz = 0;
          this.vx = 0;
          this.lying = true;
        }
      } else {
        this.lieMs -= delta;
        if (this.lieMs <= 0) {
          if (this.hp <= 0) this.state = 'dead';
          else {
            this.state = 'getUp';
            this.stateMs = this.rules.getUpMs;
          }
        }
      }
      return 'busy';
    }

    if (this.state === 'getUp') {
      this.stateMs -= delta;
      if (this.stateMs <= 0) {
        this.state = 'idle';
        this.invulnMs = this.rules.invulnMs;
        this.blinkOn = true;
      }
      return 'busy';
    }

    if (this.state === 'dead') {
      if (this.isPlayer) this.deadMs -= delta;
      return 'busy';
    }

    return 'free';
  }

  canBeHit() {
    if (this.invulnMs > 0) return false;
    if (this.state === 'knockdown' || this.state === 'getUp' || this.state === 'dead') return false;
    return true;
  }

  hurtboxWorld() {
    return {
      x: this.x - this.hurtbox.w / 2,
      y: (this.y - this.z) - this.hurtbox.h,
      w: this.hurtbox.w,
      h: this.hurtbox.h
    };
  }

  attackFrame() {
    if (!this.attack) return -1;
    const frameMs = 1000 / this.attack.fps;
    return Math.min(this.attack.frames - 1, Math.floor(this.attackElapsed / frameMs));
  }

  activeHitboxWorld() {
    if (!this.attack || !this.attack.activeFrames.includes(this.attackFrame())) return null;
    const box = this.attack.hitbox;
    const top = (this.y - this.z) + box.y;
    const left = this.facing === 1 ? this.x + box.x : this.x - box.x - box.w;
    return { x: left, y: top, w: box.w, h: box.h };
  }

  launch(direction, knockback) {
    this.state = 'knockdown';
    this.attack = null;
    this.crouch = false;
    this.vz = this.rules.knockdownZ;
    this.vx = knockback * (direction || 1);
    this.lying = false;
    this.lieMs = this.rules.lieMs;
    this.fallMs = 0;
    this.hurtElapsed = 0;
    this.struck = new Set();
    this.flashMs = this.rules.flashMs;
    this.hitstopMs = this.rules.hitstopKnockdownMs;
    if (this.z < 1) this.z = 1;
  }

  enterDead() {
    if (this.state === 'dead') return;
    this.hp = 0;
    this.state = 'dead';
    this.attack = null;
    this.crouch = false;
    this.vx = 0;
    this.vz = 0;
    if (this.isPlayer) this.deadMs = this.rules.deadMs;
  }

  beginSwing(attack, state) {
    this.attack = attack;
    this.attackElapsed = 0;
    this.attackConnected = false;
    this.attackBuffered = false;
    this.hpCostPaid = false;
    this.hitSet = new Set();
    this.crouch = false;
    this.state = state;
  }

  clearSwing() {
    this.attack = null;
    this.attackElapsed = 0;
    this.attackConnected = false;
    this.attackBuffered = false;
    this.hpCostPaid = false;
    this.hitSet.clear();
  }

  clamp() {
    const field = this.scene.playfield || { left: STAGE.left, right: STAGE.right };
    this.y = Phaser.Math.Clamp(this.y, FLOOR.top, FLOOR.bottom);
    if (!this.entered) {
      if (this.x >= field.left && this.x <= field.right) this.entered = true;
      return;
    }
    this.x = Phaser.Math.Clamp(this.x, field.left, field.right);
  }

  dismiss() {
    if (this.removed) return;
    this.removed = true;
    this.sprite.destroy();
    this.shadow.destroy();
    if (this.label) this.label.destroy();
  }

  syncView() {
    if (this.removed) return;
    this.sprite.setPosition(this.x, this.y - this.z);
    const fallen = this.state === 'dead' && !this.isPlayer && !this.heroView;
    const scaleY = fallen ? 0.4 : (this.crouch && !this.heroView ? 0.72 : 1);
    this.sprite.setScale(this.facing, scaleY);
    this.sprite.setAlpha(this.invulnMs > 0 && !this.blinkOn ? 0.35 : 1);
    this.shadow.setPosition(this.x, this.y);
    const rise = Phaser.Math.Clamp(this.z / SHADOW.fadeHeight, 0, 1);
    this.shadow.setScale(1 - rise * (1 - SHADOW.minScale));
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 0.5);
    if (this.heroView) {
      this.heroView.sync(this);
    } else if (this.flashGfx) {
      this.flashGfx.setVisible(this.flashMs > 0);
    }
    if (this.label) {
      this.label.setPosition(this.x, this.y - this.z - this.bodySize.h - 8);
      this.label.setDepth(this.y);
      this.label.setVisible(this.state !== 'dead');
    }

    if (!this.arm) return;
    if (this.attack) {
      const box = this.attack.hitbox;
      this.arm.setVisible(true);
      this.arm.setPosition(box.x + box.w / 2, box.y + box.h / 2);
      this.arm.setSize(box.w, Math.min(box.h, 28));
    } else {
      this.arm.setVisible(false);
    }
  }
}
