import { HERO_WALK } from '../config.js';
import { poseOffset } from './HeroAnims.js';

/**
 * Painted fighter. The gameplay point stays at the feet. Pose offsets only
 * move the drawing, so a lying frame can keep the same hips as the stance.
 */
export default class HeroView {
  constructor(scene, stats) {
    this.atlas = stats.atlas;
    this.pose = stats.pose || {};
    this.clip = '';
    this.sprite = scene.add.sprite(0, 0, stats.atlas, `${stats.atlas}_idle_00`);
  }

  attach(container) {
    container.add(this.sprite);
  }

  sync(fighter) {
    const pose = this.poseFor(fighter);
    this.show(pose.name, pose.index, pose.loop, fighter.hitstopMs > 0);
    if (fighter.state === 'walk' && this.clip === 'walk') {
      this.sprite.x = 0;
      this.sprite.y = 0;
    } else {
      const offsets = this.pose[pose.name];
      const count = this.sprite.anims.currentAnim ? this.sprite.anims.currentAnim.frames.length : undefined;
      this.sprite.x = poseOffset(offsets, this.sprite.anims.currentFrame, count);
      this.sprite.y = 0;
    }
    this.matchWalk(fighter);
    if (fighter.flashMs > 0) this.sprite.setTintFill(0xffffff);
    else this.sprite.clearTint();
  }

  poseFor(fighter) {
    if (fighter.attack) {
      const attack = fighter.attack;
      if (attack.loopAnim) return { name: attack.anim, loop: true };
      if (attack.holdFrame != null) return { name: attack.anim, index: attack.holdFrame, loop: false };
      return { name: attack.anim, index: Math.max(0, fighter.attackFrame()), loop: false };
    }
    if (fighter.viewClip) return fighter.viewClip;
    if (fighter.state === 'walk') return fighter.walkBlocked ? { name: 'idle', loop: true } : { name: 'walk', loop: true };
    if (fighter.state === 'jump') return { name: 'jump', loop: false };
    if (fighter.state === 'hurt') {
      return { name: 'hurt', index: this.timedIndex('hurt', fighter.hurtElapsed), loop: false };
    }
    if (fighter.state === 'getUp') {
      const frames = this.frameCount('getUp', 4);
      const progress = 1 - fighter.stateMs / fighter.rules.getUpMs;
      return { name: 'getUp', index: indexAt(progress, frames), loop: false };
    }
    if (fighter.state === 'knockdown' || fighter.state === 'dead') {
      return { name: 'knockdown', index: this.knockIndex(fighter), loop: false };
    }
    return { name: 'idle', loop: true };
  }

  frameCount(name, fallback) {
    const anim = this.sprite.anims.get(`${this.atlas}:${name}`);
    if (anim) return anim.frames.length;
    const pose = this.pose[name];
    return pose ? pose.length : fallback;
  }

  knockIndex(fighter) {
    const frames = this.frameCount('knockdown', 6);
    if (fighter.state === 'dead' || fighter.lying) return frames - 1;
    const flightMs = (2 * fighter.rules.knockdownZ / fighter.gravity) * 1000;
    const airFrames = Math.max(1, frames - 1);
    return Math.min(airFrames - 1, Math.floor(fighter.fallMs / (flightMs / airFrames)));
  }

  timedIndex(name, elapsed) {
    const anim = this.sprite.anims.get(`${this.atlas}:${name}`);
    const count = anim ? anim.frames.length : 1;
    const fps = anim ? anim.frameRate : 8;
    return Math.min(count - 1, Math.floor(elapsed / (1000 / fps)));
  }

  show(name, index, loop, frozen) {
    const key = `${this.atlas}:${name}`;
    if (!this.sprite.anims.animationManager.exists(key)) return;
    if (this.clip !== name) {
      this.sprite.play(key);
      this.clip = name;
    }
    const anims = this.sprite.anims;
    if (index != null) {
      const frames = anims.currentAnim.frames;
      const frame = frames[Math.max(0, Math.min(index, frames.length - 1))];
      if (frame) anims.setCurrentFrame(frame);
      anims.pause();
      return;
    }
    if (frozen || !loop) {
      if (frozen) anims.pause();
      return;
    }
    if (!anims.isPlaying) anims.resume();
  }

  /** Hero side walk stays at fps 24 and timeScale 1. Depth and diagonals slow the clip to match speed. */
  matchWalk(fighter) {
    const anims = this.sprite.anims;
    const walking = fighter.state === 'walk' && this.clip === 'walk' && anims.currentAnim;
    if (!walking) {
      anims.timeScale = 1;
      anims.forward = true;
      anims.inReverse = false;
      return;
    }
    anims.forward = true;
    anims.inReverse = false;
    if (this.atlas !== 'hero' || !fighter.isPlayer || fighter.hitstopMs > 0) {
      anims.timeScale = 1;
      return;
    }
    const mx = fighter.walkMoveX || 0;
    const my = fighter.walkMoveY || 0;
    const sideOnly = Math.abs(mx) > 0.01 && Math.abs(my) < 0.01;
    if (sideOnly) {
      anims.timeScale = 1;
      return;
    }
    const side = fighter.stats.walkSpeedX;
    const depth = fighter.stats.walkSpeedY;
    const speed = Math.hypot(mx * side, my * depth);
    if (speed < 0.01) {
      anims.timeScale = 1;
      return;
    }
    anims.timeScale = Math.min(
      HERO_WALK.timeScaleMax,
      Math.max(HERO_WALK.timeScaleMin, speed / side)
    );
  }
}

function indexAt(progress, count) {
  if (progress <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.floor(progress * count)));
}
