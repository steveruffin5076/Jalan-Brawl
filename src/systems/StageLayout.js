import { DISPLAY } from '../config.js';

/** The fight is framed on its section, even if the player overshoots the trigger. */
export function fightScrollForSection(stage, section) {
  const maxScroll = Math.max(0, stage.worldWidth - DISPLAY.width);
  return Math.max(0, Math.min(maxScroll, section.span[0]));
}
