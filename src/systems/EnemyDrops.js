/** Award a defeated enemy exactly once, including at most one pickup. */
export function awardEnemyKO(enemy, stage, callbacks, random = Math.random) {
  if (enemy.scored || enemy.state !== 'dead') return;
  enemy.scored = true;
  callbacks.score(stage.koScore[enemy.kind] || 0);
  const item = rollEnemyDrop(enemy.kind, stage.enemyDrops, random);
  if (item) callbacks.drop(enemy, item);
}

/** Roll at most one item when a regular enemy is defeated. */
export function rollEnemyDrop(kind, config, random = Math.random) {
  if (!config || !['punk', 'rempit', 'bruiser'].includes(kind)) return null;
  if (random() >= config.chance) return null;
  const entries = Object.entries(config.weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return null;
  let roll = random() * total;
  for (const [item, weight] of entries) {
    roll -= weight;
    if (roll < 0) return item;
  }
  return null;
}
