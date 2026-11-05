/** Temporary player attack boost; refreshed rather than stacked. */
export default class AttackBoost {
  constructor(config, registry) {
    this.config = config;
    this.registry = registry;
    this.remainingMs = 0;
    this.publish();
  }

  activate() {
    this.remainingMs = this.config.durationMs;
    this.publish();
  }

  tick(delta) {
    if (this.remainingMs <= 0) return;
    this.remainingMs = Math.max(0, this.remainingMs - Math.max(0, delta));
    this.publish();
  }

  clear() {
    if (this.remainingMs === 0) return;
    this.remainingMs = 0;
    this.publish();
  }

  damage(attacker, baseDamage) {
    if (!attacker.isPlayer || this.remainingMs <= 0) return baseDamage;
    // Keep exact tenths for small hits without exposing floating-point artifacts.
    return Math.round(baseDamage * this.config.multiplier * 100) / 100;
  }

  publish() {
    this.registry.set('attackBoostSeconds', Math.ceil(this.remainingMs / 1000));
  }
}
