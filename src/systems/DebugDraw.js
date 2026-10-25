import { DISPLAY } from '../config.js';

/** F1 overlay. Green is a hurtbox, red is a hitbox that can connect this frame. */
export function drawDebug(graphics, fighters, rules, enabled, props = []) {
  graphics.clear();
  if (!enabled) return;

  const viewLeft = graphics.scene.cameras.main.scrollX;
  const viewRight = viewLeft + DISPLAY.width;

  for (const fighter of fighters) {
    graphics.lineStyle(1, 0x9dffb5, 0.45);
    graphics.lineBetween(viewLeft, fighter.y, viewRight, fighter.y);
    graphics.lineStyle(1, 0x9dffb5, 0.18);
    graphics.lineBetween(viewLeft, fighter.y - rules.depthLane, viewRight, fighter.y - rules.depthLane);
    graphics.lineBetween(viewLeft, fighter.y + rules.depthLane, viewRight, fighter.y + rules.depthLane);

    const hurt = fighter.hurtboxWorld();
    graphics.lineStyle(2, 0x3dff6a, 1);
    graphics.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);

    const hit = fighter.activeHitboxWorld();
    if (hit) {
      graphics.lineStyle(2, 0xff4d4d, 1);
      graphics.strokeRect(hit.x, hit.y, hit.w, hit.h);
    }
  }

  for (const prop of props) {
    if (prop.broken) continue;
    const hurt = prop.hurtboxWorld();
    graphics.lineStyle(2, 0xffd56a, 1);
    graphics.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
  }
}
