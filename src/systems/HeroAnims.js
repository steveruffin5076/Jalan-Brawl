/** Phaser's AnimationFrame.index starts at 1. */
export function sequenceIndex(frame) {
  return frame ? frame.index - 1 : 0;
}

/**
 * Pose lists are stored in play order. A shorter list is sampled by progress
 * so extra in-between frames keep the same body correction.
 */
export function poseOffset(offsets, frame, frameCount) {
  if (!offsets || !offsets.length || !frame) return 0;
  const index = sequenceIndex(frame);
  const count = frameCount || offsets.length;
  if (offsets.length === count) {
    return offsets[index] == null ? 0 : offsets[index];
  }
  if (count <= 1) return offsets[0];
  const t = Math.max(0, Math.min(1, index / (count - 1)));
  const pos = t * (offsets.length - 1);
  const i = Math.floor(pos);
  const j = Math.min(offsets.length - 1, i + 1);
  const mix = pos - i;
  return offsets[i] * (1 - mix) + offsets[j] * mix;
}

/** Builds clips from the packed meta. Frame count and fps come from that meta. */
export function createFighterAnims(anims, char, meta, stats = {}) {
  const attacks = stats.attacks || {};
  bindFighter(stats, meta);

  for (const [name, spec] of Object.entries(meta.anims)) {
    const owner = Object.values(attacks).find((attack) => sameClip(attack) && attack.anim === name);
    const order = owner && owner.skipLast ? owner.playOrder : null;
    const key = `${char}:${name}`;
    if (anims.exists(key)) continue;
    anims.create({
      key,
      frames: frameNames(char, name, order || spec.frames).map((frame) => ({ key: char, frame })),
      frameRate: spec.fps,
      repeat: name === 'idle' || name === 'walk' || (owner && owner.loopAnim) ? -1 : 0
    });
  }

  for (const attack of Object.values(attacks)) {
    const clip = attack.clip || attack.anim;
    if (sameClip(attack) || attack.holdEnd || attack.loopAnim) continue;
    const spec = meta.anims[clip];
    if (!spec) continue;
    const key = `${char}:${attack.anim}`;
    if (anims.exists(key)) continue;
    anims.create({
      key,
      frames: frameNames(char, clip, attack.playOrder).map((frame) => ({ key: char, frame })),
      frameRate: spec.fps,
      repeat: 0
    });
  }
}

export function createHeroAnims(anims, meta, stats) {
  createFighterAnims(anims, 'hero', meta, stats);
}

/** Copies packed frame counts onto the live stats so the JSON cannot disagree. */
export function bindFighter(stats, meta) {
  if (!stats || !meta || !meta.anims) return;
  for (const attack of Object.values(stats.attacks || {})) {
    const clip = attack.clip || attack.anim;
    const spec = meta.anims[clip];
    if (!spec) continue;
    const order = playOrder(spec.frames, attack);
    attack.playOrder = order;
    attack.playFrames = order.length;
    attack.playFps = spec.fps;
    if (attack.holdEnd) attack.holdFrame = spec.frames - 1;
  }
  const dashName = stats.dashClip;
  if (dashName && meta.anims[dashName]) {
    stats.dashIntroFrames = Math.max(1, meta.anims[dashName].frames - 1);
  }
  if (meta.anims.call) stats.callFrames = meta.anims.call.frames;
}

export function attackDuration(attack) {
  return (attack.playFrames / attack.playFps) * 1000;
}

export function attackActive(attack, elapsed) {
  const window = attack.active;
  if (!window) return false;
  const duration = attackDuration(attack);
  if (!(duration > 0)) return false;
  const progress = elapsed / duration;
  return progress >= window[0] && progress < window[1];
}

export function frameNames(char, anim, countOrOrder) {
  const order = Array.isArray(countOrOrder)
    ? countOrOrder
    : Array.from({ length: countOrOrder }, (_, index) => index);
  return order.map((index) => `${char}_${anim}_${String(index).padStart(2, '0')}`);
}

export function heroFrames(anim, countOrOrder) {
  return frameNames('hero', anim, countOrOrder);
}

function sameClip(attack) {
  return (attack.clip || attack.anim) === attack.anim;
}

function playOrder(frameCount, attack) {
  if (!attack || attack.holdEnd || attack.loopAnim) return range(0, frameCount);
  if (attack.span) {
    const start = Math.max(0, Math.min(frameCount - 1, Math.round(attack.span[0] * frameCount)));
    const end = Math.max(start + 1, Math.min(frameCount, Math.round(attack.span[1] * frameCount)));
    return range(start, end);
  }
  if (attack.skipLast) {
    const body = range(0, Math.max(1, frameCount - 1));
    if (attack.replayFirst) body.push(0);
    return body;
  }
  return range(0, frameCount);
}

function range(start, end) {
  const list = [];
  for (let index = start; index < end; index += 1) list.push(index);
  return list;
}
