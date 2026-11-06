# Jalan Brawl progress

Updated: 5 Nov 2026

## Current status

Stage 1, its combat systems, menus, audio and recent gameplay enhancements are implemented. Recent work through the flying kick is merged into `main` (PRs #1–#15). Release and the remaining gameplay checks are still outstanding.

## Milestones

| Milestone | Status | Note |
|---|---|---|
| M1 Project setup and scaling | Done | 1280×720, landscape, rotate overlay and fullscreen. |
| M2 Movement and 2.5D | Implemented | Keyboard and touch controls; gamepad hardware testing remains. |
| M3 Combat | Implemented | Combos, jump kick, special, hitboxes, hitstop and knockdown. |
| M4 Enemies and AI | Implemented | Punk, rempit, bruiser, attack tokens, lives and respawn. |
| M5 Stage flow | Implemented | Five areas, waves, breakables, pickups, Towkay, HUD and results. |
| M6 Art tools and hero art | Implemented | Packed atlases and animation preview. |
| M7 Enemies, backgrounds and props | Implemented | Character atlases and full-area backgrounds; mobile performance untested. |
| M8 Audio and polish | In progress | Audio, settings, controls guide and UI are integrated; further testing remains. |
| M9 Release | Not started | |

## Recent completed work

- Integrated menu background, hero and combat sounds, music and ambience, pickup/movement/result sounds, and persistent audio settings (PRs #1–#5, #10). Music and ambience loop in their intended contexts; menu hover and confirmation sounds do not loop.
- Styled menus and HUD, added a first-play/pause controls guide, and added confirmation for pause-menu restart and quit (PRs #7–#9).
- Reframed all five areas to show full backgrounds, locked fights to each area, removed floating enemy labels while retaining the enemy HUD, and added occasional regular-enemy drops (PR #11). User reported area framing/transitions, drop balance and busy-fight audio mixing play-tested and done.
- Added first-entry area banners, combo score bonuses at 3/4/6 hits (+50/+100/+200, cumulative), and a refreshable 5-second +10% attack boost at 4 hits with HUD countdown (PR #12).
- Increased player and enemy movement/dash speed by 15% and shortened hitstop, without changing attack animation playback. Set `PACE_MULTIPLIER` to `1` in `src/systems/GameplayPace.js` to restore the previous movement and hitstop (PR #13).
- Replaced the yellow hit marker with a comic-style impact sprite (PR #14).
- Added a forward burst to the existing airborne jump kick, preserving its input, damage and animation. Set the speed in `src/systems/FlyingKick.js` to `0` to restore the original movement behavior (PR #15).
- Each area is now its own map. The camera stays on one area; after GO, walking into the right edge fades to black (350 ms out, 350 ms in) and the hero starts the next area at its left side. Logic is in `src/systems/MapTransition.js`; set `MAP_FADE_MS` there to change the fade length.

## Remaining work and checks

### Proposed enhancements — not yet approved for implementation

1. Weapons dropped from crates, with pickup and use mechanics.
2. Pick up and throw an intact rubbish bin.
3. Grab and throw a stunned enemy.

Grab/carry/throw visuals and controls need design decisions. The standing instruction is **not to edit characters or animations**; ask the user before any additional changes.

### Testing and release

- Play-test the flying kick, faster gameplay pace, comic impact effect, area banners and combo rewards/boost, including HUD readability and countdown.
- Test touch controls and performance/FPS in a busy fight on a phone; test a gamepad on hardware and check UI readability.
- Confirm audio behavior by listening in the browser where not already covered by the user's busy-fight audio check.
- Latest automated verification before PR #15: `npm run build`, `node --test tests/*.test.js` (39 passed), and `git diff --check`. Automated results are not a substitute for play-testing.
- `npm ci` previously reported 33 dependency vulnerabilities (3 moderate, 30 high); the production build warned about large chunks. Review before release.

## Historical notes

The following sections are retained for context from earlier development. Some background, movement, audio and UI descriptions were superseded by the recent work above; old open items have not all been re-verified.

## Smoother animations

- `npm run art` rebuilt every clip at the new frame counts. No frame count was lowered.
- Bruiser (127 frames) and Towkay (200 frames) each use two atlas pages. Hero, punk, and rempit still fit on one page. The game loads them with Phaser multiatlas.
- Attack frame counts and playback speed come from `char.meta.json`. `fighters.json` no longer stores `frames` or `fps`.
- A hit is a fraction of the move. Jab1 is active from 0.4 to 0.8. The rempit dash and Towkay lariat stay active for the whole charge. Combo hits are the first half and the second half of the source clip.
- Rempit plays every dash frame except the last during the 400ms crouch, then holds the last frame. Towkay's call is 20 frames across the 1000ms call.
- Hurt clips are 250ms (Towkay 300ms). A longer hitstun holds the last hurt frame. The knockdown fall still follows the 409ms flight, then the last frame holds for the 800ms lie. Hero getUp is 400ms, the same as the get-up timer. Punk, rempit, and bruiser getUp are 500ms, and Towkay getUp is 619ms, so those clips are still squeezed into the 400ms timer.
- Pose offsets are still the old lists. Extra frames sample them by progress.
- Preview check: every clip on all five characters matched its meta frame count and fps, including frames on the second atlas page. Feet stayed on the preview line.

## Historical open items (27 Oct 2026; not re-verified)

- Phone browser checks, including the touch joystick and FPS in the busiest wave.
- A real gamepad.
- Volume sliders and all sound (M8).
- The HUD portrait is still a blue square. That art is M8.
- Towkay does not use an attack token, so he can swing while two punks attack. Everyone else stays at two attackers.
- The jump clip is mostly crouches, so he stays low in the air until the last frame.
- The special skips the last packed frame, which faces the camera, and replays the opening stance. Preview still shows that last frame.
- Jab2 now lasts 421ms and the special lasts 800ms, because playback follows the packed clip. The old fighter file played jab2 in 250ms and the special in 667ms. The hit is still the same portion of each move.
- The art tool cut a few pixels on hero jump-kick frames 4–7 and knockdown frames 6 and 9. The 320 canvas is too small for those poses.
- Attack boxes were lined up on the older frames. On the jump kick, the box sits on the leg while the foot reaches past it.
- Hero walk is constant speed: `walkSpeedX` 180, `walkSpeedY` 115. The clip is 28 frames at 24 fps, timeScale 1, forward. Left and right turn to face the move. Up, down and diagonal set walk timeScale to actual speed / 180 (0.6–1.2). Stride measurement, root motion and walk sprite offsets were removed.
- Lying down still changes the silhouette. The pose offsets hold the hips, not the head and feet.
- One hurtbox is centered on the body, so a wide stance or the rempit dash can leave a foot outside it.
- A lamp post still marks each section join. The sky gap between those pictures is closed.
- The plan checklist says three background layers. The v1 art is two layers, and that is what is in the game.

## Historical walk slide fix (3 Nov 2026)

- Cause: `tools/pack-atlas.mjs` wrote each frame pivot as a fraction of the trimmed rect. Phaser applies a custom pivot to the full canvas (sourceSize), so every frame was drawn 13–50 px off and the feet jumped while walking. All characters and all clips were affected.
- Fix: pivot is now `feetX / sourceSize.w`, `feetY / sourceSize.h`. All 5 atlas JSONs were updated to match (same result as a repack). Feet now sit exactly on the fighter's y point (before: 10 px above).
- Knockdown and getUp pose lists in `fighters.json` now have one value per frame. They include the old draw offset, so those clips look the same as before.
- Walking into a wall or floor edge now shows idle instead of a walk in place (`Fighter.syncView` sets `walkBlocked`).
- Test (headless, fixed 60 fps): hero drawn position matched x on every walk frame (error 0 px) right and left. Planted shoe stays within ~5 px. Up/down into the floor edge shows idle.
- Backups of the changed files: `_backup_pivotfix/`.
- Still open: punk, rempit, bruiser and boss1 walks still use evenly spaced frames, so their feet can creep a little. Next step is the same frame pick as the hero walk.
- Crates and bins: a hit needed the hero within 24 px of the prop's depth, but the crate looks much deeper, so standing in front of it often missed. Props now use `propDepthLane` 40 (combat.json). Fighters keep `depthLane` 24.
