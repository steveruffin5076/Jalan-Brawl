import { attackDuration } from './HeroAnims.js';

/** Sound cues follow combat events, without changing fighter state or animations. */
export default class CombatAudio {
  constructor(sound) {
    this.sound = sound;
    this.hitSwings = new WeakMap();
    this.slamSwings = new WeakMap();
  }

  play(name) {
    this.sound.play(`combat-${name}`, { volume: 0.7 });
  }

  hit(attacker) {
    // A swing can connect with several fighters at once; play one impact for it.
    if (this.hitSwings.get(attacker) === attacker.hitSet) return;
    this.hitSwings.set(attacker, attacker.hitSet);
    // The slam already has its own impact cue at the active frame.
    if (attacker.kind === 'bruiser' && attacker.attack.anim === 'slam') return;
    const attack = attacker.attack;
    const name = attacker.isPlayer && attack.anim === 'special'
      ? 'hit-special'
      : (attack.knockdown || attack.anim === 'hook' ? 'hit-heavy' : 'hit-light');
    this.play(name);
  }

  breakProp(prop) {
    if (prop.spec.image === 'crate') this.play('crate-break');
    if (prop.spec.image === 'bin') this.play('bin-break');
  }

  /** Called after each enemy update. The previous AI state is captured before it. */
  enemyUpdate(enemy, previousAI) {
    if (enemy.kind === 'rempit' && previousAI !== enemy.ai) {
      if (enemy.ai === 'telegraph') this.play('rempit-warning');
      else if (enemy.ai === 'dash') this.play('rempit-charge');
    }
    if (enemy.kind === 'boss1' && previousAI !== 'dash' && enemy.ai === 'dash') {
      this.play('towkay-lariat');
    }
    const attack = enemy.attack;
    if (enemy.kind !== 'bruiser' || !attack || attack.anim !== 'slam') return;
    const activeStart = attackDuration(attack) * attack.active[0];
    if (enemy.attackElapsed >= activeStart && this.slamSwings.get(enemy) !== enemy.hitSet) {
      this.slamSwings.set(enemy, enemy.hitSet);
      this.play('bruiser-slam');
    }
  }

  landing(fighter, wasLying) {
    if (!wasLying && fighter.state === 'knockdown' && fighter.lying) this.play('knockdown');
  }
}
