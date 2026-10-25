import Phaser from 'phaser';

/** A crate or bin. One swing can hit it once; breaking it spills a pickup. */
export default class Breakable {
  constructor(scene, x, y, spec, drop) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.hp = spec.hp;
    this.hurtbox = { w: spec.w, h: spec.hurtH };
    this.drop = drop;
    this.broken = false;
    this.flashMs = 0;
    this.spec = spec;
    this.display = spec.display;
    if (spec.image && scene.textures.exists(spec.image)) {
      this.sprite = scene.add.image(x, y, spec.image)
        .setOrigin(spec.originX, spec.originY)
        .setDisplaySize(spec.display, spec.display)
        .setDepth(y);
    } else {
      const color = Phaser.Display.Color.HexStringToColor(spec.color).color;
      this.sprite = scene.add.rectangle(x, y, spec.w, spec.h, color)
        .setOrigin(0.5, 1)
        .setDepth(y);
    }
  }

  hurtboxWorld() {
    return {
      x: this.x - this.hurtbox.w / 2,
      y: this.y - this.hurtbox.h,
      w: this.hurtbox.w,
      h: this.hurtbox.h
    };
  }

  hurt(amount) {
    if (this.broken) return;
    this.hp -= amount;
    this.flashMs = this.scene.rules.flashMs;
    if (this.hp <= 0) this.breakOpen();
  }

  breakOpen() {
    if (this.broken) return;
    this.broken = true;
    if (this.spec.broken && this.sprite.setTexture) {
      this.sprite.setTexture(this.spec.broken);
      this.sprite.setOrigin(this.spec.brokenOriginX, this.spec.brokenOriginY);
      this.sprite.setDisplaySize(this.display, this.display);
      this.sprite.clearTint();
    } else {
      this.sprite.destroy();
    }
    this.scene.dropPickup(this.x, this.y, this.drop);
  }

  tick(delta) {
    if (this.broken) return;
    this.flashMs = Math.max(0, this.flashMs - delta);
    if (this.sprite.setTintFill) {
      if (this.flashMs > 0) this.sprite.setTintFill(0xffffff);
      else this.sprite.clearTint();
      return;
    }
    this.sprite.setAlpha(this.flashMs > 0 ? 0.45 : 1);
  }
}
