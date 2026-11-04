/** Keeps a handful of spark sprites and reuses them instead of creating one per hit. */
export default class CombatSystem {
  constructor(scene, rules) {
    this.scene = scene;
    this.rules = rules;
    this.sparks = [];
    for (let i = 0; i < 8; i += 1) {
      const dot = scene.add.circle(0, 0, 8, 0xffe08a, 1).setVisible(false).setDepth(4000);
      this.sparks.push({ dot, life: 0 });
    }
  }

  update(delta, fighters, props = []) {
    for (const spark of this.sparks) {
      if (spark.life <= 0) continue;
      spark.life -= delta;
      if (spark.life <= 0) spark.dot.setVisible(false);
    }

    for (const fighter of fighters) {
      if (!fighter.attack || fighter.hitstopMs > 0) continue;
      const hitbox = fighter.activeHitboxWorld();
      if (!hitbox) continue;
      for (const target of fighters) {
        if (target === fighter) continue;
        this.tryHit(fighter, target, hitbox);
      }
      if (!fighter.isPlayer) continue;
      for (const prop of props) {
        if (!prop.broken) this.tryBreak(fighter, prop, hitbox);
      }
    }

    this.chainKnockdowns(fighters);
  }

  tryHit(attacker, target, hitbox) {
    if (attacker.hitSet.has(target)) return;
    if (!target.canBeHit()) return;
    if (Math.abs(attacker.y - target.y) > this.rules.depthLane) return;
    if (Math.abs(attacker.z - target.z) > hitbox.h) return;
    const hurt = target.hurtboxWorld();
    if (!overlaps(hitbox, hurt)) return;

    attacker.hitSet.add(target);
    attacker.attackConnected = true;
    target.hp = Math.max(0, target.hp - attacker.attack.damage);
    target.flashMs = this.rules.flashMs;
    this.paySpecial(attacker);

    const armored = target.superArmor && target.state === 'attack' && !attacker.attack.knockdown;
    if (target.isPlayer && target.hp <= 0) {
      target.enterDead();
    } else if (armored) {
      attacker.hitstopMs = this.rules.hitstopMs;
      if (target.hp <= 0) target.enterDead();
    } else if (attacker.attack.knockdown) {
      target.launch(attacker.facing, attacker.attack.knockback || this.rules.chainKnockback);
      attacker.hitstopMs = this.rules.hitstopKnockdownMs;
      this.scene.cameras.main.shake(this.rules.shakeMs, this.rules.shakeIntensity);
    } else {
      target.state = 'hurt';
      target.attack = null;
      target.crouch = false;
      target.hurtElapsed = 0;
      target.hurtMs = attacker.attack.hitstun;
      target.hitstopMs = this.rules.hitstopMs;
      attacker.hitstopMs = this.rules.hitstopMs;
    }

    if (target.isPlayer) this.scene.registry.set('playerHp', target.hp);
    if (attacker.isPlayer) {
      attacker.noteHit();
      this.showEnemyBar(target);
    }
    this.spark(overlapCenter(hitbox, hurt));
  }

  tryBreak(attacker, prop, hitbox) {
    if (attacker.hitSet.has(prop)) return;
    if (Math.abs(attacker.y - prop.y) > this.rules.depthLane) return;
    if (attacker.z > hitbox.h) return;
    const hurt = prop.hurtboxWorld();
    if (!overlaps(hitbox, hurt)) return;
    attacker.hitSet.add(prop);
    attacker.attackConnected = true;
    this.paySpecial(attacker);
    prop.hurt(attacker.attack.damage);
    this.spark(overlapCenter(hitbox, hurt));
  }

  paySpecial(attacker) {
    if (!attacker.attack.hpCost || !attacker.isPlayer || attacker.hpCostPaid) return;
    attacker.hp = Math.max(1, attacker.hp - attacker.attack.hpCost);
    attacker.hpCostPaid = true;
    this.scene.registry.set('playerHp', attacker.hp);
  }

  showEnemyBar(target) {
    if (!target.name) return;
    this.scene.enemyFocusMs = this.rules.enemyBarMs;
    this.scene.registry.set('enemyName', target.name);
    this.scene.registry.set('enemyHp', target.hp);
    this.scene.registry.set('enemyMaxHp', target.maxHp);
  }

  chainKnockdowns(fighters) {
    for (const flyer of fighters) {
      if (flyer.state !== 'knockdown' || flyer.lying || flyer.z <= 0) continue;
      const body = flyer.hurtboxWorld();
      const direction = Math.sign(flyer.vx) || flyer.facing;
      for (const other of fighters) {
        if (other === flyer || other.isPlayer) continue;
        if (flyer.struck.has(other) || !other.canBeHit()) continue;
        if (Math.abs(flyer.y - other.y) > this.rules.depthLane) continue;
        const hurt = other.hurtboxWorld();
        if (!overlaps(body, hurt)) continue;
        flyer.struck.add(other);
        other.launch(direction, this.rules.chainKnockback);
        this.spark(overlapCenter(body, hurt));
      }
    }
  }

  spark(point) {
    const spark = this.sparks.find((item) => item.life <= 0) || this.sparks[0];
    spark.life = this.rules.sparkMs;
    spark.dot.setPosition(point.x, point.y).setVisible(true);
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlapCenter(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}
