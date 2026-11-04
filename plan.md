# plan.md — "Jalan Brawl" (working title)

2.5D side-scrolling beat 'em up (Streets of Rage style), set in a Malaysian city at night.
Web browser game for **mobile + desktop**, built with **Phaser 3**.

> Instructions for Cursor: read this whole file before writing code. Build milestone by milestone, in order.
> Do not start a milestone until the previous one passes its acceptance checklist.
> Use **placeholder shapes first** (Milestones 1–5). Real art is swapped in later (Milestone 6+).

---

## 0. How to use this plan (for you, the director)

**Roles:** You = director + tester. Cursor = writes all code and tools. Claude = planning, design questions, reviewing problems.
You don't need to understand §5. Cursor reads it. Your job: run each milestone, test the checklist, report bugs, save.

### 0.1 One-time setup
1. Install **Node.js LTS**, **Git**, **Cursor**, and **ffmpeg** (Windows: open a terminal and run `winget install ffmpeg`, then restart the terminal; check with `ffmpeg -version`).
2. Create an empty folder, e.g. `jalan-brawl`, open it in Cursor.
3. Put this `plan.md` in the folder root.
4. In Cursor's terminal: `git init` (turns on save points, see 0.5).

### 0.2 The loop (repeat for every milestone)
1. Open a **new Cursor chat** (Agent mode). One milestone = one chat, so Cursor stays focused.
2. Paste the **Start milestone** prompt (0.3), with the milestone number changed.
3. Cursor builds, then gives you a test list.
4. Run the game (0.4) and test **every** checklist item in §11 on desktop **and** phone.
5. Bug found → paste the **Bug report** prompt. Repeat until all pass.
6. All pass → **save point** (0.5).
7. Next milestone, new chat.

### 0.3 Prompt templates (copy-paste)

**Start milestone:**
```
Read plan.md fully. Build Milestone M2 only (see §11). Do not start M3.
Follow every rule in §12.
When done, give me:
1. Files created or changed
2. A step-by-step manual test for every M2 checklist item (desktop + phone)
3. Known issues or anything you were unsure about
```

**Bug report:**
```
Bug in M2.
Steps: (what you did, in order)
Expected: (what should happen)
Actual: (what happened)
Device/browser: (e.g. Windows Chrome / Android Chrome)
Console error: (paste the red text, if any)
Fix this bug only. Don't change other features.
```

**Tuning a number:**
```
Change only the value in /src/data/fighters.json: hero walkSpeedX from 220 to 260.
Don't change any code.
```
(Or open the JSON file and change it yourself. That's the point of keeping numbers in JSON.)

**Cursor did too much / went off track:**
```
Stop. Undo everything not required by Milestone M2 in plan.md. List what you removed.
```

### 0.4 How to test

**Desktop:**
1. Cursor terminal: `npm run dev`
2. Open the `Local:` link it prints (e.g. `http://localhost:8080`) in Chrome.
3. Press **F12** → Console tab to see errors. Copy red errors into bug reports.
4. Press **F1** in the game to show hitboxes (from M3 onward).

**Phone (same Wi-Fi as the PC):**
1. Stop the server (Ctrl+C), run `npm run dev -- --host`
2. Terminal prints a `Network:` link, e.g. `http://192.168.1.23:8080`
3. Type that link into Chrome on the phone.
4. Doesn't load? Windows Firewall is blocking Node. Allow "Node.js" on Private networks when the popup appears (or in Windows Defender Firewall → Allow an app).
5. Rotate the phone to landscape. Tap Fullscreen.

### 0.5 Save points (git)

After a milestone passes **all** checks:
```
git add .
git commit -m "M2 movement done"
```

Cursor broke things since the last save and you want to go back:
> ⚠️ **Warning:** the command below **permanently deletes all changes made since your last commit**. Only use it when you want to throw that work away.
```
git restore .
git clean -fd
```

Tip: you can also ask Cursor "show me what changed since the last commit" before deciding.

### 0.6 Workload estimate (know before starting)

| Work | Amount |
|---|---|
| Code milestones M1–M5 (placeholder) | Cursor does it; your time = testing + bug reports |
| Character animation clips (Grok) | Hero ~14, Punk ~6, Rempit ~7, Bruiser ~7, Boss ~9 → **~43 clips**, plus re-rolls |
| Background images | 1 shared skyline + 5 section images = **6** (v1 uses 2 layers) |
| Props + pickups + UI images | ~10 |

Grok's free credits are limited, so art will take several sessions. Do the **hero first**, prove the pipeline works in-game (M6), then do the rest.

---

## 1. Game summary

- Player walks left → right through one stage, fighting waves of enemies, ending with a boss.
- "2.5D" = flat 2D sprites, but the player can move **up/down on the floor band** (depth), like Streets of Rage.
- Painted / HD art style (AI-generated), Malaysian city at night: neon shophouses, night market, back alleys, warehouse.
- Session length: one stage ≈ 6–10 minutes.

### v1 scope (first playable — do NOT add more)

| Item | v1 |
|---|---|
| Stages | 1 (4 sections + boss arena) |
| Playable heroes | 1 |
| Enemy types | 3 + 1 boss |
| Pickups | health food (2 sizes), score items |
| Breakables | crates, trash bins |
| Weapons | none (backlog) |
| Co-op | none (backlog) |
| Save | high score only (localStorage) |

---

## 2. Tech stack

- **Phaser 3** (latest 3.x, e.g. 3.90), **JavaScript** (ES modules), **Vite**.
- Start from the official template: `npm create @phaserjs/game@latest` → choose Vite + JavaScript.
- Physics: **none for combat** (custom code, see §5). Arcade Physics is not needed — beat 'em up movement and hit detection are simpler and more controllable by hand.
- Plugins: **rexrainbow `rexvirtualjoystickplugin`** (mobile joystick). Install `phaser3-rex-plugins`.
- Atlas packing: **free-tex-packer** (desktop app, free) → output "Phaser 3" JSON format.
- Hosting: itch.io (HTML5) first. Later: CrazyGames / Poki.

---

## 3. Display & devices

- Base resolution: **1280 × 720**, landscape.
- `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`.
- Phone in portrait → show a "Please rotate your phone" overlay and pause the game.
- Mobile: a **Fullscreen button** on the title screen (`this.scale.startFullscreen()` must run inside a pointer event).
- Detect touch: `this.sys.game.device.input.touch` → show the touch controls only on touch devices.
- Target: 60 FPS on a mid-range Android phone in Chrome. Minimum acceptable 45 FPS.
- `pixelArt: false`, `antialias: true` (painted art).

---

## 4. Folder structure

```
/src
  main.js                 // Phaser config, scene list
  /scenes
    BootScene.js          // load the loading-bar assets
    PreloadScene.js       // load everything, show progress
    TitleScene.js
    GameScene.js          // the stage
    HUDScene.js           // runs in parallel on top of GameScene
    PauseScene.js
    GameOverScene.js
    StageClearScene.js
  /entities
    Fighter.js            // base class: position, z, state machine, hp, hit logic
    Player.js             // extends Fighter
    Enemy.js              // extends Fighter, AI
    Boss.js               // extends Enemy
    Breakable.js
    Pickup.js
  /systems
    InputManager.js       // keyboard + gamepad + touch → one unified input object
    CombatSystem.js       // hitbox vs hurtbox checks, damage, hitstop
    AIDirector.js         // attack tokens, surround slots
    WaveManager.js        // camera locks, spawning waves from stage JSON
    DepthSort.js
    CameraController.js
    AudioManager.js
  /data
    fighters.json         // stats + animation + hitbox data per character
    stage1.json           // sections, waves, breakables, pickups
  /ui
    TouchControls.js
    HealthBar.js
/public/assets
  /atlases                // hero.png + hero.json, punk.png + punk.json, ...
  /backgrounds
  /audio/music  /audio/sfx
```

---

## 5. Core systems (most important section)

### 5.1 Coordinates: x, y, z

Every fighter has:
- `x` — left/right position in the world.
- `y` — **floor depth** (feet position on the floor band). Higher y = closer to the camera.
- `z` — height above the floor (0 when standing; > 0 when jumping or flying from a knockdown).

Drawing:
- Sprite drawn at `(x, y - z)`.
- A **shadow ellipse** is always drawn at `(x, y)` (on the floor), scaled smaller when z is larger.
- All sprite origins = **feet, bottom-center** `setOrigin(0.5, 1)`.

Floor band: the walkable area is `y` between `FLOOR_TOP` (≈ 470) and `FLOOR_BOTTOM` (≈ 700) at 720p. Clamp `y` to this range.

### 5.2 Depth sorting

Every frame: `sprite.setDepth(entity.y)` for fighters, breakables and pickups.
Shadows: depth = `entity.y - 0.5`. Background layers use fixed negative depth. HUD is in its own scene.

### 5.3 Movement

- Walk speed: x 220 px/s, y 140 px/s (depth movement is slower — feels right in SoR).
- 8-direction movement. Face direction flips with the x input (`sprite.setFlipX`).
- Jump: z velocity 700, gravity 2200 px/s², can steer x slightly in air.
- Run (v1 optional): double-tap forward → speed ×1.6.

### 5.4 Fighter state machine

States: `idle, walk, jump, attack, jumpAttack, special, hurt, knockdown, getUp, dead, grabbed (backlog)`.
Rules:
- `hurt` and `knockdown` interrupt everything except `dead`.
- After `getUp`: **1.0 s invulnerability** (sprite blinks).
- Only `idle`/`walk` can start a new action. `attack` can chain into the next combo hit inside a buffer window.

### 5.5 Combat: hitboxes & hurtboxes (data-driven)

- **Hurtbox**: one rectangle per fighter, relative to the feet (e.g. width 70, height 180).
- **Hitbox**: defined per attack animation, only active on certain frames.
- **Depth check**: a hit only connects if `|attacker.y - target.y| <= 24` (same depth lane). This is what makes 2.5D work. Also `|attacker.z - target.z| <= hitbox height`.
- Each attack hits a target **once** per swing (track hit list per swing).

Example in `fighters.json`:

```json
"hero": {
  "hp": 100, "walkSpeedX": 220, "walkSpeedY": 140,
  "hurtbox": { "w": 70, "h": 180 },
  "attacks": {
    "jab1":  { "anim": "jab1",  "damage": 4,  "activeFrames": [2, 3], "hitbox": { "x": 40, "y": -140, "w": 70, "h": 40 }, "knockdown": false, "hitstun": 250 },
    "jab2":  { "anim": "jab2",  "damage": 4,  "activeFrames": [2, 3], "hitbox": { "x": 40, "y": -140, "w": 70, "h": 40 }, "knockdown": false, "hitstun": 250 },
    "hook":  { "anim": "hook",  "damage": 6,  "activeFrames": [3, 4], "hitbox": { "x": 45, "y": -145, "w": 80, "h": 45 }, "knockdown": false, "hitstun": 300 },
    "kick":  { "anim": "kick",  "damage": 10, "activeFrames": [3, 4], "hitbox": { "x": 50, "y": -110, "w": 95, "h": 50 }, "knockdown": true,  "knockback": 260 },
    "jumpKick": { "anim": "jumpKick", "damage": 12, "activeFrames": [1, 2, 3, 4], "hitbox": { "x": 35, "y": -90, "w": 80, "h": 60 }, "knockdown": true, "knockback": 220 },
    "special": { "anim": "special", "damage": 15, "activeFrames": [2, 3, 4, 5], "hitbox": { "x": -110, "y": -150, "w": 220, "h": 150 }, "knockdown": true, "knockback": 300, "hpCost": 8 }
  }
}
```

Hitbox `x` is mirrored when the fighter faces left.

> Note: all hitbox/hurtbox pixel numbers above are **first guesses**. They get tuned at M6 using the F1 debug view and the Anim Preview scene (§7.5), once the real art is in.

### 5.6 Combo & feel

- Attack button chain: **jab1 → jab2 → hook → kick** (4th hit knocks down).
- Combo buffer: press attack during the last 40% of the current attack anim → queue next hit.
- If 0.5 s passes without hitting attack, combo resets.
- Combo only continues if the previous hit **connected** (like SoR). Whiffing resets to jab1.
- **Special** (attack + jump together, or its own button): 360° hit, costs 8 HP **only if it hits**, never kills the player (min HP 1).
- **Hitstop**: on hit, freeze attacker + target for 60 ms (90 ms on knockdown hits).
- **Screen shake**: 80 ms, intensity 0.004 on knockdown hits.
- **Hit flash**: target tinted white for 50 ms.
- Hit spark sprite at the hitbox overlap center.
- Combo counter on HUD ("12 HITS!") — resets 1.5 s after the last hit.

### 5.7 Knockdown

- Target flies back: z velocity 450, x velocity = knockback × facing.
- Lands → `knockdown` state 0.8 s on the floor → `getUp` 0.4 s → invulnerable 1.0 s.
- A knocked-down enemy that is thrown/flies into other enemies at the same depth also knocks them down (fun, cheap to add).

### 5.8 Enemy AI (AIDirector)

- **Attack tokens**: max **2 enemies** may attack the player at once. Others hover around.
- **Surround slots**: positions around the player (left-front, right-front, left-back, right-back at ±160 px x, ±40 px y). Each enemy claims the nearest free slot and walks there.
- Enemy loop: `approach slot → wait (0.4–1.2 s random) → request token → line up depth (match player y) → attack → release token → back off`.
- Enemies spawned off-screen walk in from the screen edges.
- Enemies never leave the floor band or the locked camera area.

### 5.9 Camera & waves (WaveManager)

- Camera follows the player x only (no vertical scroll). World is wide (e.g. 6000 px).
- Stage has **sections**. When the player reaches a section trigger x → **camera locks**, the player can't walk past the screen edge, waves spawn.
- When all waves of the section are dead → unlock + flashing **"GO →"** arrow + sound.
- Data in `stage1.json`:

```json
{
  "worldWidth": 6000,
  "sections": [
    { "triggerX": 900,  "waves": [ [ {"type":"punk","side":"right"}, {"type":"punk","side":"left"} ],
                                   [ {"type":"punk","side":"right"}, {"type":"rempit","side":"right"} ] ] },
    { "triggerX": 2200, "waves": [ ... ] },
    { "triggerX": 3600, "waves": [ ... ] },
    { "triggerX": 4800, "waves": [ ... ] },
    { "triggerX": 5600, "boss": "boss1", "waves": [] }
  ],
  "breakables": [ {"type":"crate","x":700,"y":600,"drop":"nasiLemak"} ],
  "pickups": []
}
```

### 5.10 Unified input (InputManager)

Produces one object every frame: `{ moveX, moveY, attackPressed, jumpPressed, specialPressed, pausePressed }`.

| Action | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | Arrows / WASD | Left stick / D-pad | Virtual joystick (left side) |
| Attack | J | A / Cross | Big button (right) |
| Jump | K | B / Circle | Button (right) |
| Special | L | Y / Triangle | Button (right) |
| Pause | Esc / P | Start | Pause icon (top-right) |

Touch controls: semi-transparent, min **72 px** buttons, multi-touch enabled (`this.input.addPointer(3)`). Joystick dead zone 15%.

---

## 6. Content (Malaysian city theme)

Keep everything original — no real brands, logos or real people.

### Hero (v1)
- Working name: **"Adam"** — ex-boxer, denim jacket, rolled sleeves. Balanced stats.

### Enemies (v1)

| Id | Name | HP | Behavior |
|---|---|---|---|
| `punk` | Street Punk | 30 | Basic. Slow 2-hit punch. Most common. |
| `rempit` | Rempit Racer | 25 | Fast. Dashes across the screen with a shoulder charge (knockdown). Telegraph: crouch 0.4 s before dash. |
| `bruiser` | Bruiser | 70 | Slow, big. **Super armor** on his own attack (doesn't flinch from jabs while swinging). Heavy overhead slam (knockdown). |

### Boss
- `boss1` — **"Towkay"** (gang boss) in the warehouse. HP 250, HP bar at the top of the screen.
- Moves: 3-hit combo, running lariat across the screen, at 50% HP calls 2 punks as backup (once).

### Stage 1 — "Night in the City"

| Section | Place | Notes |
|---|---|---|
| 1 | Night market street (pasar malam) | Stalls, lanterns, tutorial wave (2 punks) |
| 2 | Shophouse row, neon signs | First rempit |
| 3 | Back alley | Bins, bruiser debut |
| 4 | LRT underpass | Mixed waves |
| Boss | Warehouse | Towkay |

### Pickups (local food = health)
- **Teh tarik** → +20 HP
- **Nasi lemak** → full HP
- **Cash bundle** → +500 score

Breakables (crates, bins) drop pickups as set in `stage1.json`.

---

## 7. Art pipeline (painted HD, free AI tools)

### 7.0 Art schedule
All prompts and the full art schedule are in **`art-guide.md`** (the user's manual guide). Summary:
- M1–M2: hero master image. M3–M4: hero non-attack clips. After M5 passes: hero attack clips.
- M6a: pipeline test with `art/raw/hero/idle.mp4`. M6: hero in game.
- After M6: enemies, boss, backgrounds (2 layers in v1: shared far skyline + one main image per section), props.
- Props that must contain green (e.g. nasi lemak) use a **#FF00FF magenta** background. `anim-config.json` and the prop loader must support a per-file key color.

Based on the reference video, but the Blender steps are replaced with **ffmpeg + scripts that Cursor writes**. You make images and clips by hand; everything after that is **one command: `npm run art`**.

### 7.1 Tools
1. **Gemini (Nano Banana)** — character master images, backgrounds, props, pickups. (manual, in browser)
2. **Grok (Imagine) image-to-video** — animates the master image into a short clip. (manual, in browser)
3. **ffmpeg** — removes the green background and exports PNG frames. (automatic, via script)
4. **Node script with `sharp`** — picks frames, trims, aligns feet, resizes. (automatic, Cursor writes it)
5. **`free-tex-packer-core`** (npm) — packs frames into a Phaser 3 atlas. (automatic, Cursor writes it)

Blender is only a fallback if ffmpeg keying looks bad on a specific clip.

### 7.2a Your manual art steps (per animation)
1. Gemini: generate the character **master image** once (prompt rules in 7.2). Save as `art/master/hero.png`.
2. Grok: upload the master image → make video → describe the move, e.g. *"facing right, throws a quick left jab and returns to fighting stance, camera does not move, green background stays"*.
3. Download the clip and save it with this exact naming: **`art/raw/<character>/<anim>.mp4`**, e.g. `art/raw/hero/walk.mp4`, `art/raw/hero/jab1.mp4`.
4. Run `npm run art`.
5. Open the generated preview `art/out/hero/_preview_<anim>.png` and check: green edges gone? Feet on the red line in every frame? If not, re-roll the clip in Grok or adjust 7.4 settings.

### 7.2 Rules (consistency is everything)
- Every character prompt ends with: **`full body, side view facing right, plain solid #00FF00 green background`**.
- Generate one **master reference image** per character first. All animations start from that same image.
- Cover the AI watermark (bottom-right star) with green before using the image.
- Backgrounds: full-frame, wide 16:9. v1 uses **2 layers**: a shared far skyline (slow parallax) + one main image per section (buildings + street, bottom 35% = walkable floor). Not keyed, loaded directly from `public/assets/backgrounds/`.

### 7.3 Animation list per character

| Anim | Frames (target) | Loop |
|---|---|---|
| idle | 6 | yes |
| walk | 8 | yes |
| jab1, jab2, hook | 4–5 each | no |
| kick | 6 | no |
| jump | 4 | no |
| jumpKick | 5 | no |
| special | 8 | no |
| hurt | 3 | no |
| knockdown (fall + lie) | 6 | no |
| getUp | 4 | no |
| dead | reuse knockdown | — |

Enemies need fewer: idle, walk, attack, hurt, knockdown, getUp (+ dash for rempit, slam for bruiser).

### 7.4 Automated frame pipeline (Cursor builds this at M6a)

Folders:
```
/art
  /master/<char>.png          // Gemini master images (manual)
  /raw/<char>/<anim>.mp4      // Grok clips (manual)
  /frames/<char>/<anim>/      // step A output (generated, don't edit)
  /out/<char>/                // step B output + previews (generated)
  anim-config.json            // settings per character
/tools
  extract-frames.mjs          // step A
  process-frames.mjs          // step B
  pack-atlas.mjs              // step C
```

`package.json` script: `"art": "node tools/extract-frames.mjs && node tools/process-frames.mjs && node tools/pack-atlas.mjs"`.
Each script only re-processes clips that are newer than their output (fast re-runs).

`art/anim-config.json` example:
```json
{
  "hero": {
    "targetHeight": 220,
    "canvas": [320, 320],
    "key": { "color": "0x00FF00", "similarity": 0.30, "blend": 0.10 },
    "anims": {
      "idle":  { "frames": 6, "trim": [0.2, 2.0] },
      "walk":  { "frames": 8 },
      "jab1":  { "frames": 4 },
      "kick":  { "frames": 6 }
    }
  }
}
```
(`trim` = optional start/end seconds to use from the clip.)

**Step A — extract-frames.mjs** (green removal):
For every `art/raw/<char>/<anim>.mp4`, run ffmpeg. The core command is:
```
ffmpeg -ss 0.2 -to 2.0 -i art/raw/hero/walk.mp4 -vf "fps=15,colorkey=0x00FF00:0.30:0.10,despill=type=green" art/frames/hero/walk/%03d.png
```
- `colorkey` similarity: raise toward 0.40 if green edges remain, lower toward 0.20 if parts of the character disappear. Set per character in `anim-config.json`.
- Grok sometimes shifts the green shade. Script should sample the top-left 10×10 px of the first frame and use that color as the key if it differs from #00FF00 by more than a small threshold (log it).

**Step B — process-frames.mjs** (using npm `sharp`):
1. Pick N frames **evenly spaced** from the extracted frames (N = `frames` in config).
2. Trim each frame to its non-transparent area (alpha > 20).
3. **Find the feet**: bottom = lowest row with opaque pixels; feet x = center of the opaque pixels in the bottom 8% of the trimmed area.
4. **Scale**: one scale factor per character = `targetHeight / height of idle frame 0`. Use the **same factor for every animation**, so the character never changes size between moves.
5. Paste onto a transparent canvas (`canvas` size) with the feet at **(canvas width / 2, canvas height − 10)**.
6. Save as `art/out/<char>/<char>_<anim>_00.png`, `_01.png`, …
7. Write a **preview sheet** per animation, `art/out/<char>/_preview_<anim>.png`: all frames side by side on a grey background with a **red horizontal feet line** and a red vertical center line.
8. Warn in the terminal if any frame gets cut off by the canvas edge.

**Step C — pack-atlas.mjs** (using npm `free-tex-packer-core`):
- Pack `art/out/<char>/<char>_*.png` (not previews) → `public/assets/atlases/<char>.png` + `<char>.json`.
- Exporter "Phaser3", max size 2048 × 2048, trim on, padding 2, allow rotation **off**.
- If one atlas doesn't fit in 2048² → stop with a clear error (reduce frame counts or canvas size).

**In game:** `this.load.atlas('hero', 'assets/atlases/hero.png', 'assets/atlases/hero.json')`, create animations with `this.anims.generateFrameNames('hero', { prefix: 'hero_walk_', start: 0, end: 7, zeroPad: 2 })`. Animation frame rate and frame counts come from `fighters.json`.

### 7.5 Anim Preview scene (dev tool)
- Opens with `?preview=1` in the URL. Not included in the menu.
- Pick character + animation from a list (keyboard arrows or tap).
- Plays the animation looping on a big grid, with the feet line, origin point and the hitbox/hurtbox from `fighters.json` drawn on top (active frames highlighted).
- Buttons: play/pause, step frame, speed 0.25× / 1×.
- Use it to check sliding feet and to tune hitbox numbers to match the art.

### 7.6 Placeholder art (Milestones 1–5)
- Fighters = colored rounded rectangles (hero blue, punk red, rempit orange, bruiser purple, boss black) with a small triangle showing facing.
- Debug draw (toggle with **F1**): hurtboxes green, active hitboxes red, depth lane lines.
- Anim timing driven by the same data (frame count × fps) so swapping in real art doesn't change gameplay.

---

## 8. Audio

- Music: **Suno**. ⚠️ Songs made on Suno's **free plan cannot be used commercially**. Since this game is meant to earn money: either use a paid Suno plan when generating the final tracks, or use free-license music (e.g. CC0 from OpenGameArt / Pixabay Music — check each license).
- Tracks: title, stage, boss, stage clear jingle.
- SFX (CC0 sources or generated): punch light, punch heavy, kick, whoosh (miss), body fall, glass/crate break, pickup, "GO" alert, player hurt, enemy KO.
- Use **audio sprites** or short `.ogg` + `.mp3` pairs. Unlock audio on the first tap (mobile requirement).
- Music volume / SFX volume sliders in Pause menu, saved to localStorage.

---

## 9. HUD & screens

- Top-left: hero portrait, HP bar, lives (3), score.
- Top-center: boss HP bar (only during boss).
- Top-right: pause button.
- Combo counter near the hero's HP bar.
- Enemy HP: small bar + name above the HUD when the player hits an enemy (SoR style).
- Screens: Title (Start, Fullscreen, Settings) → Game → Pause (Resume, Restart, Volume, Quit) → Game Over (Continue / Title) → Stage Clear (score, time, max combo).

---

## 10. Performance budget (mobile)

- Max on screen: 1 hero + 6 enemies + 6 props.
- Total texture memory target: < 120 MB. Use WebP for backgrounds if large; atlases max 2048².
- No per-frame object creation in hot loops (reuse hit sparks via an object pool).
- Test on a real phone every milestone (Chrome Android + Safari iOS if available) using the Vite dev server over LAN (`vite --host`).

---

## 11. Milestones & acceptance checklists

### M1 — Project setup & scaling
- Vite + Phaser template runs. Scenes created (empty). 1280×720 FIT, landscape. Rotate overlay in portrait. Fullscreen button works on phone.
- ✅ Opens on desktop + phone over LAN, correct letterboxing, no stretching.

### M2 — Movement & 2.5D
- Placeholder hero moves in 8 directions on the floor band, jumps (z), has a shadow, flips facing. Depth sorting with 3 static placeholder dummies.
- Keyboard + gamepad + touch joystick all drive the same InputManager.
- ✅ Walking behind/in front of dummies sorts correctly. Cannot leave the floor band. Touch joystick works with a second finger on the jump button.

### M3 — Combat vs dummies
- Combo chain, jump kick, special, hit/hurt boxes from `fighters.json`, depth-lane check, hitstop, flash, shake, knockdown, getUp, invulnerability. F1 debug draw.
- ✅ Hitting a dummy in a different depth lane does nothing. 4th hit knocks down. Special costs HP only on hit. Each swing hits a target once.

### M4 — Enemies & AI
- `punk`, `rempit`, `bruiser` with AI, attack tokens, surround slots. Player can be hurt, knocked down, die, lose a life, respawn.
- ✅ Never more than 2 enemies attacking at once. Bruiser armor works. Rempit dash is telegraphed and avoidable.

### M5 — Stage flow (still placeholder art)
- `stage1.json` sections, camera locks, waves, "GO →", breakables, pickups, boss with HP bar, Game Over, Stage Clear, HUD, Pause.
- ✅ Full stage playable start to finish in placeholder art. **This is the "fun check" — tune numbers here before any art work.**

### M6a — Art tools
- Build the `npm run art` pipeline (§7.4) and the Anim Preview scene (§7.5). Test with **one** real clip (`art/raw/hero/idle.mp4`).
- ✅ `npm run art` runs with no errors. Preview sheet shows no green edges and feet on the red line. Atlas loads in the Anim Preview scene and plays.

### M6 — Art: hero
- Real hero atlas replaces the placeholder. Hitbox data tuned in the Anim Preview scene to match the art.
- ✅ No sliding feet, no jitter between animations, same character size in every animation, hitboxes line up with fists/feet in F1 view.

### M7 — Art: enemies, boss, backgrounds, props
- All atlases + 3-layer parallax backgrounds for each section.
- ✅ Holds 60 FPS (min 45) on a mid-range phone during the busiest wave.

### M8 — Audio & polish
- Music, SFX, volume settings, hit sparks, KO slow-motion on the boss's final hit (0.5 s at 30% speed), title screen art.
- ✅ Audio starts after the first tap on iOS/Android. No missing sounds.

### M9 — Release
- Production build (`npm run build`), upload to itch.io as HTML5 (zip of `dist`), test on itch on phone + desktop.
- ✅ Loads in < 8 s on 4G. High score saves.

---

## 12. Rules for Cursor

1. Read `plan.md` before every milestone. Stay inside v1 scope — put new ideas in §13 Backlog, don't build them.
2. All tunable numbers (speeds, damage, timings, frame ranges) live in `/src/data/*.json` or a `config.js` constants file — never hard-coded inside logic.
3. One class per file. Small functions. Comment *why*, not *what*.
4. No new npm packages without explaining why first.
5. After each milestone: list what was built, what to test manually, and any known issues.
6. Never break a previous milestone's checklist. Re-test M2–M3 after big changes to Fighter.js.
7. Use `this.time` / `delta` for all timing (frame-rate independent). No `setTimeout`.
8. Keep the F1 debug view working through all milestones.
9. Never run `git commit`, `git restore`, `git reset` or delete files outside `/src`, `/tools`, `/public` without asking. The user makes the save points.
10. At the end of every milestone, remind the user: "Test the checklist, then commit: `git commit -m "M<number> done"`".
11. Files in `/art/frames` and `/art/out` are generated — never edit them by hand; change the scripts or `anim-config.json` instead.

---

## 13. Backlog (after v1 — not now)

- Weapons pickup (lead pipe, wok, rattan cane) with durability.
- Grab + throw.
- Second and third hero (character select).
- Stages 2–3 (e.g. Penang heritage street, Genting-style highland resort, port at Klang).
- 2-player local co-op (desktop keyboard + gamepad).
- Difficulty levels, online leaderboard.
- Ads / CrazyGames or Poki SDK integration.
