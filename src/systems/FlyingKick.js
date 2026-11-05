/** Adds a reversible horizontal burst to the existing airborne kick. */
export default class FlyingKick {
  constructor(speed = 250) {
    this.speed = speed; // Set to 0 to restore the original jump-kick movement.
    this.attack = null;
    this.direction = 0;
  }

  update(player, delta, wasFrozen = false) {
    if (player.state !== 'jumpAttack' || !player.attack || player.z <= 0) {
      this.attack = null;
      this.direction = 0;
      return;
    }
    if (this.attack !== player.attack) {
      this.attack = player.attack;
      this.direction = player.facing;
    }
    if (this.speed === 0) return;
    // Keep the hitbox facing the direction of the burst, including during hitstop.
    player.facing = this.direction;
    if (wasFrozen) return;
    player.x += this.direction * this.speed * delta / 1000;
    player.clamp();
  }
}
