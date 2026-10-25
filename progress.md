# Jalan Brawl progress

Updated: 25 Oct 2026

**Now:** M7 is in the fight on PC. Next is M8. Phone FPS has not been checked.

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

## Still open

- Phone browser checks, including the touch joystick and FPS in the busiest wave.
- A real gamepad.
- Volume sliders and all sound (M8).
- The HUD portrait is still a blue square. That art is M8.
- Towkay does not use an attack token, so he can swing while two punks attack. Everyone else stays at two attackers.
- The jump clip is mostly crouches, so he stays low in the air until the last frame.
- special frame 6 is still a three-quarter view. The next frame is the side stance, then idle.
- Walk pins the chest, so the feet can slide a little. The old foot-pin jump is gone.
- Lying down still changes the silhouette. The pose offsets hold the hips, not the head and feet.
- One hurtbox is centered on the body, so a wide stance or the rempit dash can leave a foot outside it.
- The underpass and warehouse pictures are cropped to their shorter sections. Their art does not run edge to edge, so some skyline shows beside them.
- The plan checklist says three background layers. The v1 art is two layers, and that is what is in the game.
