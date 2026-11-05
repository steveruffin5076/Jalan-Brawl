/** Pace adjustment without modifying character data or animation playback.
 * Set PACE_MULTIPLIER to 1 to restore the original movement and hitstop. */
export const PACE_MULTIPLIER = 1.15;

export function fasterMovement(stats, multiplier = PACE_MULTIPLIER) {
  const adjusted = { ...stats };
  for (const key of ['walkSpeedX', 'walkSpeedY', 'dashSpeed']) {
    if (typeof stats[key] === 'number') adjusted[key] = stats[key] * multiplier;
  }
  return adjusted;
}

export function fasterCombat(rules, multiplier = PACE_MULTIPLIER) {
  return {
    ...rules,
    hitstopMs: rules.hitstopMs / multiplier,
    hitstopKnockdownMs: rules.hitstopKnockdownMs / multiplier
  };
}
