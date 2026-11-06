import { HERO_START, STAGE } from '../config.js';
import { fightScrollForSection } from './StageLayout.js';

/** Length of each half of the black fade (out, then in). */
export const MAP_FADE_MS = 350;

/** How close to the right wall the hero must walk to leave a cleared map. */
export const EXIT_SLACK = 4;

/** Camera scroll and walkable edges for one map (one stage section). */
export function mapView(stage, index) {
  const section = stage.sections[index] || stage.sections[0];
  const scroll = fightScrollForSection(stage, section);
  return { scroll, left: scroll + STAGE.left, right: scroll + STAGE.right };
}

/** True when the current map is cleared and the hero has walked into its right edge. */
export function exitReady(flow, mapIndex, player, playfield) {
  if (flow.locked || !flow.showGo || flow.sectionIndex <= mapIndex) return false;
  if (player.state !== 'idle' && player.state !== 'walk') return false;
  if (player.z > 0) return false;
  return player.x >= playfield.right - EXIT_SLACK;
}

/** Where the hero stands when the next map fades in. */
export function entryPoint(stage, index) {
  return { x: mapView(stage, index).scroll + HERO_START.x, y: HERO_START.y };
}
