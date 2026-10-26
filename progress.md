# Jalan Brawl progress

Updated: 25 Oct 2026

**Now:** Character clips use the denser frame counts from `art/anim-config.json`. Next is M8. Phone FPS has not been checked.

Phone checks are deferred until PC development and PC checks are finished. There is no git repo yet.

## Milestones

| Milestone | Status | Note |
|---|---|---|
| M1 Project setup and scaling | Done | 1280×720, landscape, rotate overlay, fullscreen button. Checked on PC. |
| M2 Movement and 2.5D | Done | Walk, jump, shadow, depth sort, keyboard. Touch controls are in the build. A gamepad was not tried on hardware. |
| M3 Combat vs dummies | Done | Combo, jump kick, special, hitboxes, hitstop, knockdown, F1. Dummies were removed when M4 added enemies. |
| M4 Enemies and AI | Done | Punk, rempit, bruiser. Two-attacker limit, bruiser armor, telegraphed rempit dash, lives and respawn. |
| M5 Stage flow | Done | One stage, camera locks, waves, GO arrow, crates and bins, food and cash, Towkay, HUD, pause, game over, stage clear. |
| M6a Art tools | Done | `npm run art` and the Anim Preview scene (`?preview=1`). Preview can switch characters. |
| M6 Hero art | Done | Painted hero atlas is in the fight. Hurtbox is 110×220. Attack boxes were lined up on the fists and the kicking foot. |
| M7 Enemies, boss, backgrounds, props | Done on PC | Painted punk, rempit, bruiser, and Towkay. Two background layers. Crates, bins, and pickups use the prop art. Phone FPS is not checked. |
| M8 Audio and polish | Not started | |
| M9 Release | Not started | |

## M7 detail

- The fight loads `punk`, `rempit`, `bruiser`, and `boss1` from `public/assets/atlases`.
- Punk plays the attack clip as two hits: frames 0–4, then frames 5–9.
- Rempit plays dash frames 0–6 during the crouch, then holds frame 7 for the charge.
- Bruiser slam winds up with the arms high. The hit is the smash frame only.
- Towkay plays combo as jab then straight, then uppercut. Lariat loops while he runs. At 50% HP he plays call and two punks walk in. If he is already swinging or dashing, the call waits until that move ends.
- Backgrounds are the shared skyline (`bg_far`, parallax 0.22) plus one picture per section, scaled from 768 px to 720 px tall. The top 18% of each section picture is left out so the skyline shows above the roofs. The street stays on the bottom.
- Pasar Malam is one picture stretched to the section, so it is not tiled. A lamp post stands on each section join.
- Crates and bins swap to the broken picture and drop the pickup. Teh tarik, nasi lemak, and cash use the prop art.
- Preview: http://localhost:8080/?preview=1

## Smoother animations

- `npm run art` rebuilt every clip at the new frame counts. No frame count was lowered.
- Bruiser (127 frames) and Towkay (200 frames) each use two atlas pages. Hero, punk, and rempit still fit on one page. The game loads them with Phaser multiatlas.
- Attack frame counts and playback speed come from `char.meta.json`. `fighters.json` no longer stores `frames` or `fps`.
- A hit is a fraction of the move. Jab1 is active from 0.4 to 0.8. The rempit dash and Towkay lariat stay active for the whole charge. Combo hits are the first half and the second half of the source clip.
- Rempit plays every dash frame except the last during the 400ms crouch, then holds the last frame. Towkay's call is 20 frames across the 1000ms call.
- Hurt clips are 250ms (Towkay 300ms). A longer hitstun holds the last hurt frame. The knockdown fall still follows the 409ms flight, then the last frame holds for the 800ms lie. Hero getUp is 400ms, the same as the get-up timer. Punk, rempit, and bruiser getUp are 500ms, and Towkay getUp is 619ms, so those clips are still squeezed into the 400ms timer.
- Pose offsets are still the old lists. Extra frames sample them by progress.
- Preview check: every clip on all five characters matched its meta frame count and fps, including frames on the second atlas page. Feet stayed on the preview line.

## Still open

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
- Walk uses every extracted frame at 24 fps and pins both shoes. The chest sway per frame is about 7px for the hero, 7px for the punk, 4px for the bruiser, 5px for the boss, and 13px for the rempit.
- Lying down still changes the silhouette. The pose offsets hold the hips, not the head and feet.
- One hurtbox is centered on the body, so a wide stance or the rempit dash can leave a foot outside it.
- A lamp post still marks each section join. The sky gap between those pictures is closed.
- The plan checklist says three background layers. The v1 art is two layers, and that is what is in the game.
