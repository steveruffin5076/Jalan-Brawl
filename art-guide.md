# art-guide.md — Jalan Brawl art (for you, not Cursor)

How to make every image and animation by hand with free tools, and **when** to make each one.
Tools: **Gemini (Nano Banana)** for images, **Grok Imagine** for image-to-video.
After saving clips, the `npm run art` pipeline (plan.md §7.4) does the rest.

---

## 1. Art schedule (which phase)

| Code milestone (Cursor) | Your art work at the same time | Section |
|---|---|---|
| M1–M2 | Hero **master image** (+ 2 helper poses) | §4 |
| M3–M4 | Hero clips that won't change: **idle, walk, jump, hurt, knockdown, getUp** | §5 |
| M5 (fun check) | Wait. Play the placeholder game. Decide if attacks change. | — |
| After M5 passes | Hero attack clips: **jab1, jab2, hook, kick, jumpKick, special** | §5 |
| M6a | Run `npm run art` on `idle.mp4` only, check preview | plan §7.4 |
| M6 | All hero clips in game | — |
| M6 → M7 | Enemy + boss masters and clips, backgrounds, props, pickups | §6, §7, §8 |
| M8 | Hero portrait, title screen art | §9 |

Rule: **don't make enemy art before the hero works in game (M6).** If the pipeline needs changes, you only redo one character.

---

## 2. Golden rules (read once)

1. **Every character starts from ONE master image.** Every clip of that character is made from that same master. Never animate a frame cut from another clip (the face and clothes slowly drift).
2. **Always facing right, side view.** The game flips sprites for facing left. Enemies too.
3. **No green anywhere on characters or props** (clothes, hair, eyes, items). The green-screen removal deletes it. Also avoid very bright yellow-green.
4. **No floor shadow** under characters. The game draws its own shadow. A painted shadow becomes a dark blob after keying.
5. **Full body with space around it**: head to feet visible, nothing cut off at the edges, about 15% empty green around the character.
6. **Animations happen in place.** The game moves the character, so walking is "walking on a treadmill" and jumping goes straight up.
7. **One action per clip.** Short and simple works best. Long or complex moves make Grok invent extra things.
8. **Cover the Gemini watermark** (bottom-right sparkle) with a green rectangle **before** uploading to Grok (Paint: pick the green with the color picker, draw a filled rectangle over the mark).
9. Generate 2–4 versions of anything and pick the best. Keep the good ones, delete the rest.

---

## 3. Style block (paste at the end of EVERY character and prop prompt)

```
Style: 2D side-scrolling beat 'em up game sprite, hand-painted digital art, bold clean dark outlines, cel shading with soft painted highlights, rich vibrant colors, 1990s arcade brawler feel with modern HD detail. Full body, entire character visible from head to feet with empty space around, strict side view facing right, flat orthographic camera, no perspective. Plain solid pure #00FF00 green background, flat and even, no floor, no shadow on the ground, no text, no logo, no watermark, no other characters.
```

Backgrounds use a different block (§7).

---

## 4. Hero master image (during M1–M2)

### 4.1 Master (Gemini)

```
Create a game character: Adam, a Malaysian ex-boxer in his late 20s, athletic muscular build, short black hair with a clean undercut, determined expression, light stubble. Wears a faded blue denim jacket with sleeves rolled to the elbows over a white tank top, black cargo pants, red boxing hand wraps on both hands, white sneakers with red laces. Pose: relaxed boxing fighting stance, fists raised near the chin, knees slightly bent, weight balanced.
[paste STYLE BLOCK]
```

Check before accepting:
- [ ] Facing right, true side view (not 3/4 toward camera)
- [ ] Whole body, both feet visible, space around
- [ ] Background pure flat green, no floor shadow
- [ ] No green on the character
- [ ] You like the face. You'll see it thousands of times.

Save as `art/master/hero.png`. (Cover the watermark first.)

### 4.2 Helper poses (Gemini, edit mode — upload `hero.png` with the prompt)

Some clips can't start from a standing pose. Make these stills from the master:

**Lying down** (start image for `getUp`):
```
Same character, same outfit, same art style, same green background. Change only the pose: lying flat on his back on the ground, knocked out, head on the left, feet on the right, side view. Nothing else changes.
```
Save `art/master/hero_lying.png`.

**Mid-air** (start image for `jumpKick`):
```
Same character, same outfit, same art style, same green background. Change only the pose: in mid-air at the top of a jump, knees tucked up, fists up, side view facing right. Nothing else changes.
```
Save `art/master/hero_air.png`.

If Gemini changes the face or clothes, re-roll and add: "Keep the face, hair and every clothing detail exactly identical to the uploaded image."

---

## 5. Hero animations (Grok)

### 5.1 How to make one clip
1. Open Grok Imagine, upload the start image (usually `hero.png`).
2. Choose video, paste the prompt = **action line** (table below) + **animation block**.
3. Generate. Check it with §5.3. Re-roll if needed.
4. Download, rename, save to `art/raw/hero/<anim>.mp4`.

### 5.2 Animation block (paste after every action line)

```
Camera is locked: completely static, no zoom, no pan, no shake. The character stays in strict side view facing right and never turns toward the camera. The character stays in the same spot in the frame. The solid green background never changes. No other characters, no effects, no text. Same character, same clothes for the whole clip.
```

### 5.3 Hero action lines

| Anim | Start image | Action line (paste first) | When |
|---|---|---|---|
| `idle` | hero.png | `He stays in a boxing fighting stance, breathing, bouncing lightly on his feet, fists up. A smooth seamless loop that ends in exactly the starting pose.` | M3–M4 |
| `walk` | hero.png | `He walks forward in place like on a treadmill, keeping his fists up in a guarded stance, steady steps. A smooth seamless loop.` | M3–M4 |
| `jump` | hero.png | `He crouches, jumps straight up in place, tucks his knees at the top, then lands back in his fighting stance.` | M3–M4 |
| `hurt` | hero.png | `He gets hit in the face, his head snaps back, he staggers back slightly, then returns to his fighting stance.` | M3–M4 |
| `knockdown` | hero.png | `He is hit hard, flies backward and falls flat on his back on the ground, then lies still.` | M3–M4 |
| `getUp` | hero_lying.png | `He pushes himself up from the ground and stands up into his boxing fighting stance.` | M3–M4 |
| `jab1` | hero.png | `He throws one quick straight left jab forward, then pulls it back to his fighting stance.` | after M5 |
| `jab2` | hero.png | `He throws one quick straight right punch forward, then pulls it back to his fighting stance.` | after M5 |
| `hook` | hero.png | `He throws one powerful left hook punch, rotating his hips, then returns to his fighting stance.` | after M5 |
| `kick` | hero.png | `He throws one powerful high front kick forward with his right leg, then returns to his fighting stance.` | after M5 |
| `jumpKick` | hero_air.png | `In mid-air, he extends his right leg forward into a flying side kick and holds it.` | after M5 |
| `special` | hero.png | `He spins around in one full fast circle with both arms extended, a spinning backfist attack, then returns to his fighting stance.` | after M5 |

`dead` reuses `knockdown`.

### 5.4 Check each clip

- [ ] Same face and clothes from start to end
- [ ] Never turns toward the camera
- [ ] Camera doesn't move or zoom
- [ ] Stays roughly in place (walk is in place)
- [ ] Hands and feet stay inside the frame
- [ ] Background stays flat green

### 5.5 Fixes

| Problem | Add to the prompt / do this |
|---|---|
| Turns to face the camera | `He stays in profile the whole time, we only ever see his right side.` |
| Camera zooms or pans | Move the animation block to the **start** of the prompt. |
| Walks out of frame | `He does not move forward; his body stays at the center of the frame.` |
| Too slow / too many extra moves | Shorten the action line to one simple sentence. Use `trim` in `anim-config.json` to cut the clip. |
| Morphing body, extra limbs | Re-roll. If it keeps happening, simplify the move. |
| Face changes | Re-roll. Never use a frame from a bad clip as a new start image. |
| Free credits used up | Stop for the day. Note which clips are done in the tracker (§10). |

---

## 6. Enemies and boss (after M6)

Same steps as the hero: master (Gemini + style block), then clips (Grok + animation block). All face **right**.

### 6.1 Master prompts

**Street Punk** (`punk`):
```
Create a game enemy: a lanky street punk thug in his early 20s, spiky red dyed hair, sneering face, sleeveless black leather vest with metal studs, ripped grey jeans, heavy black boots, chain hanging from his belt. Pose: hunched aggressive fighting stance, fists up.
[paste STYLE BLOCK]
```

**Rempit Racer** (`rempit`):
```
Create a game enemy: a skinny, fast young street racer, open-face motorcycle helmet with the visor pushed up, oversized orange and black racing jacket, black track pants, rubber sandals. Pose: low ready stance, leaning forward, about to sprint.
[paste STYLE BLOCK]
```

**Bruiser** (`bruiser`):
```
Create a game enemy: a towering heavyset brawler, very large and wide, bald head, thick black beard, tattoos on his arms, tight dark red sleeveless shirt, work trousers, steel-toe boots. Pose: wide heavy stance, big fists down by his sides. He should look about 1.3 times taller and much wider than a normal man.
[paste STYLE BLOCK]
```

**Boss: Towkay** (`boss1`):
```
Create a game boss: a powerful middle-aged crime boss, muscular and broad-shouldered, slicked-back grey hair, thin moustache, dark sunglasses, white suit jacket worn open over a black shirt, gold chain, black dress trousers, polished shoes. Pose: confident fighting stance, one fist forward.
[paste STYLE BLOCK]
```

Save as `art/master/punk.png`, `rempit.png`, `bruiser.png`, `boss1.png`. Make a lying-down helper for each (§4.2 prompt, change the name).

### 6.2 Enemy action lines (+ animation block)

| Character | Anim | Action line |
|---|---|---|
| all | `idle` | `He stands in his fighting stance, breathing, shifting his weight slightly. A smooth seamless loop.` |
| all | `walk` | `He walks forward in place like on a treadmill, in his fighting stance. A smooth seamless loop.` |
| all | `hurt` | `He gets hit in the face, his head snaps back, he staggers back slightly, then recovers.` |
| all | `knockdown` | `He is hit hard, flies backward and falls flat on his back on the ground, then lies still.` |
| all | `getUp` (lying image) | `He pushes himself up from the ground and stands up into his fighting stance.` |
| punk | `attack` | `He throws two quick wild punches forward, left then right, then returns to his stance.` |
| rempit | `attack` | `He throws one quick straight punch forward, then returns to his stance.` |
| rempit | `dash` | `He crouches low, then bursts forward in place into a shoulder charge, leading with his right shoulder, and holds the charge pose.` |
| bruiser | `attack` | `He swings one huge right hook punch forward, slow and heavy, then returns to his stance.` |
| bruiser | `slam` | `He raises both fists together high above his head, then slams them down hard in front of him.` |
| boss1 | `combo` | `He throws a fast three-hit combo: left jab, right punch, then a powerful uppercut, then returns to his stance.` |
| boss1 | `lariat` | `He runs forward in place with his right arm stretched straight out to the side at neck height, a lariat attack.` |
| boss1 | `call` | `He points forward and waves his hand, calling his men to attack, angry expression.` |

---

## 7. Backgrounds (during M6 → M7)

**v1 uses 2 layers per area** (simpler than plan's 3):
- **Far layer**: one night skyline image shared by all sections, scrolls slowly.
- **Main layer**: one image per section with buildings + walkable street. **The bottom 35% of the image must be empty street floor** (that's the walk area, plan §5.1).

### 7.1 Background style block

```
Style: 2D side-scrolling beat 'em up game background, hand-painted digital art, bold outlines, rich vibrant night colors, 1990s arcade brawler feel with modern HD detail. Flat side view, camera pointing straight at the buildings, no perspective vanishing point, horizon at eye level. The bottom 35% of the image is an empty flat street floor running left to right. No people, no characters, no vehicles, no real brand names or logos, invented shop sign text only. Wide 16:9 image.
```

### 7.2 Prompts

**Far layer — skyline:**
```
Night city skyline of Kuala Lumpur-style towers far in the distance, twin-tower-like silhouettes and a tall TV tower shape, purple and deep blue sky, a few stars, glowing windows. Only the sky and distant buildings, no street. Wide 16:9 image, hand-painted 2D game background, flat side view.
```

**Section 1 — Night market:**
```
A busy-looking Chinatown night market street at night, red lanterns strung overhead, food stalls with striped tarp roofs and glowing bulbs, old two-storey shophouses behind, steam rising, wet street reflecting the lights.
[paste BACKGROUND STYLE BLOCK]
```

**Section 2 — Shophouse row:**
```
A row of old colourful colonial shophouses at night with arched five-foot walkways, pink and blue neon signs with invented Malay and Chinese shop names, closed metal shutters with graffiti, street lamps.
[paste BACKGROUND STYLE BLOCK]
```

**Section 3 — Back alley:**
```
A narrow back alley behind shophouses at night, exposed pipes, air-conditioner units, hanging laundry, big metal rubbish bins against the wall, one flickering orange light, puddles on the ground.
[paste BACKGROUND STYLE BLOCK]
```

**Section 4 — LRT underpass:**
```
Under an elevated light-rail track at night, thick concrete pillars, steel girders above, a train passing overhead with lit windows, graffiti on pillars, cold blue and white lights.
[paste BACKGROUND STYLE BLOCK]
```

**Boss — Warehouse:**
```
Inside a large dark warehouse at night, stacked wooden crates and shipping pallets, hanging industrial lamps making pools of light, a half-open rolling shutter door, oil stains on the concrete floor.
[paste BACKGROUND STYLE BLOCK]
```

### 7.3 Joining sections
Each section image ≈ 1280 px wide in game, and the world is 6000 px, so roughly one image per section. To hide the seam where two images meet:
- Ask Gemini (edit mode): `Extend this image to the right by half its width, continuing the same street seamlessly.`, or
- Put a **foreground prop** at the seam (a pillar, lamp post or parked stall) drawn in front of everything. Ask Cursor to add it.

Save as `public/assets/backgrounds/bg_far.png`, `bg_s1.png` … `bg_boss.png` (backgrounds don't go through `npm run art`).

---

## 8. Props and pickups (M7)

Gemini, style block at the end. Replace the "character" lines of the style block with "object".

| File | Prompt start |
|---|---|
| `crate.png` | `A single sturdy wooden shipping crate with metal corners, side view.` |
| `crate_broken.png` | `The same wooden crate smashed into broken planks and splinters, side view.` |
| `bin.png` | `A single dented metal rubbish bin with lid, side view.` |
| `bin_broken.png` | `The same rubbish bin knocked over, lid off, rubbish spilled, side view.` |
| `tehtarik.png` | `A glass mug of frothy Malaysian teh tarik milk tea, game pickup item, slightly glowing outline.` |
| `nasilemak.png` | `A wrapped banana-leaf packet of nasi lemak opened to show rice, sambal, egg and peanuts, game pickup item, slightly glowing outline.` |
| `cash.png` | `A small bundle of paper money with a rubber band, game pickup item, slightly glowing outline.` |

⚠️ Banana leaf is green. For `nasilemak.png` use a **magenta background** instead: replace `#00FF00 green` with `#FF00FF magenta` in the style block, and tell Cursor that file uses magenta keying. Same for any prop that must be green.

---

## 9. UI art (M8)

**Hero portrait** (HUD, top-left):
```
Same character, head and shoulders portrait, facing right, determined expression, same art style, same green background.
```
(Edit mode with `hero.png` uploaded.)

**Title screen** (16:9, no green background):
```
Arcade beat 'em up title screen art: the hero Adam in a denim jacket and red hand wraps standing in a fighting stance in the middle of a neon-lit Kuala Lumpur-style street at night, gang thugs silhouetted behind him, dramatic low angle, hand-painted 2D game key art. Leave empty space at the top for the game logo. No text.
```
Add the game title text yourself later (Canva / Photopea, free).

---

## 10. Asset tracker (copy into a sheet, tick as you go)

| Character | Asset | Start image | Done | Notes |
|---|---|---|---|---|
| hero | master | — | ☐ | |
| hero | lying / air helpers | hero.png | ☐ | |
| hero | idle, walk, jump, hurt, knockdown, getUp | — | ☐ ☐ ☐ ☐ ☐ ☐ | |
| hero | jab1, jab2, hook, kick, jumpKick, special | — | ☐ ☐ ☐ ☐ ☐ ☐ | after M5 |
| punk | master + 6 clips | — | ☐ | |
| rempit | master + 7 clips | — | ☐ | |
| bruiser | master + 7 clips | — | ☐ | |
| boss1 | master + 8 clips | — | ☐ | |
| bg | far + 5 sections | — | ☐ | |
| props | 7 items | — | ☐ | |
| UI | portrait, title | — | ☐ | |

Note: Gemini and Grok change their screens often, so this guide gives the prompts and rules, not exact buttons. If a screen confuses you, send Claude a screenshot and get the click spots marked.
