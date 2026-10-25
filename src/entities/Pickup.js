import Phaser from 'phaser';

export default class Pickup {
  constructor(scene, x, y, spec) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.spec = spec;
    this.taken = false;
    if (spec.image && scene.textures.exists(spec.image)) {
      this.sprite = scene.add.image(x, y, spec.image)
        .setOrigin(spec.originX, spec.originY)
        .setDisplaySize(spec.display, spec.display)
        .setDepth(y);
    } else {
      const color = Phaser.Display.Color.HexStringToColor(spec.color).color;
      this.sprite = scene.add.rectangle(x, y, 36, 28, color)
        .setOrigin(0.5, 1)
        .setDepth(y);
    }
    this.label = scene.add.text(x, y - spec.display - 6, spec.label, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#f4f1e8'
    }).setOrigin(0.5, 1).setDepth(y);
  }

  tryCollect(player) {
    if (this.taken || player.state === 'dead' || player.z > 40) return;
    const stage = this.scene.stage;
    if (Math.abs(player.x - this.x) > stage.pickupReachX) return;
    if (Math.abs(player.y - this.y) > stage.pickupReachY) return;
    this.taken = true;
    if (this.spec.full) player.hp = player.maxHp;
    else if (this.spec.heal) player.hp = Math.min(player.maxHp, player.hp + this.spec.heal);
    if (this.spec.score) this.scene.addScore(this.spec.score);
    this.scene.registry.set('playerHp', player.hp);
    this.sprite.destroy();
    this.label.destroy();
  }
}
