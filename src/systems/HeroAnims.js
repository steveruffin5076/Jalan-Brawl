/** Phaser's AnimationFrame.index starts at 1. */
export function sequenceIndex(frame) {
  return frame ? frame.index - 1 : 0;
}

/** Pose lists are stored in play order, not Phaser's 1-based frame index. */
export function poseOffset(offsets, frame) {
  if (!offsets || !frame) return 0;
  const value = offsets[sequenceIndex(frame)];
  return value == null ? 0 : value;
}

/** Builds clips for one atlas. Attack timing in fighters.json wins over the meta fps. */
export function createFighterAnims(anims, char, meta, attacks = {}) {
  const byAnim = new Map();
  for (const attack of Object.values(attacks)) {
    const clip = attack.clip || attack.anim;
    if (clip === attack.anim) byAnim.set(attack.anim, attack);
  }

  for (const [name, spec] of Object.entries(meta.anims)) {
    const attack = byAnim.get(name);
    const playback = visualAttack(attack);
    const key = `${char}:${name}`;
    if (anims.exists(key)) continue;
    anims.create({
      key,
      frames: frameNames(char, name, spec, playback.attack).map((frame) => ({ key: char, frame })),
      frameRate: playback.attack ? playback.attack.fps : spec.fps,
      repeat: name === 'idle' || name === 'walk' || playback.loop ? -1 : 0
    });
  }

  for (const attack of Object.values(attacks)) {
    const clip = attack.clip || attack.anim;
    if (clip === attack.anim) continue;
    const spec = meta.anims[clip];
    if (!spec) continue;
    const key = `${char}:${attack.anim}`;
    if (anims.exists(key)) continue;
    anims.create({
      key,
      frames: frameNames(char, clip, spec, attack).map((frame) => ({ key: char, frame })),
      frameRate: attack.fps,
      repeat: 0
    });
  }
}

export function createHeroAnims(anims, meta, attacks) {
  createFighterAnims(anims, 'hero', meta, attacks);
}

/**
 * A loop or a held frame still needs every painted frame.
 * frameOrder is only for a slice, such as the hero special or one hit of a combo clip.
 */
function visualAttack(attack) {
  if (!attack || attack.loopAnim || attack.holdFrame != null) {
    return { attack: null, loop: !!(attack && attack.loopAnim) };
  }
  return { attack, loop: false };
}

export function frameNames(char, anim, spec, attack) {
  const count = attack ? attack.frames : spec.frames;
  const order = attack && attack.frameOrder && attack.frameOrder.length
    ? attack.frameOrder
    : Array.from({ length: count }, (_, index) => index);
  return order.map((index) => `${char}_${anim}_${String(index).padStart(2, '0')}`);
}

export function heroFrames(anim, spec, attack) {
  return frameNames('hero', anim, spec, attack);
}
