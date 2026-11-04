# Besi Works Studio – Splash Screen Kit

Pixel-art splash (3.6 seconds): the cat blacksmith hits the anvil twice, "BESI WORKS" appears with each hit, then "STUDIO" appears with a chime. Any key, click or tap skips it.

## Files

| File | Use |
|---|---|
| `assets/besi_splash_sheet.png` | Landscape sprite sheet: 36 frames, 160×90 each, 6 columns × 6 rows, 12 fps |
| `assets/besi_splash_sheet_portrait.png` | Portrait sprite sheet: 36 frames, 90×160 each, 6 columns × 6 rows, 12 fps |
| `assets/besi_splash.json` | Frame size, fps and sound timing (for any engine) |
| `assets/besi_splash.ogg` / `.mp3` | Sound (OGG for Godot and most browsers, MP3 for Safari) |
| `assets/besi_splash.wav` | Original sound, to edit or re-export |
| `godot/splash.gd`, `godot/splash.tscn` | Godot 4 splash scene |
| `phaser/SplashScene.js` | Phaser 3/4 scene |
| `web/besiSplash.js` | Plain JavaScript splash for Three.js or any web game |
| `profile/` | Profile picture: 512, 1024 and 32 px PNG |

The code picks the sheet by screen shape: portrait sheet when the screen is taller than wide, landscape sheet otherwise. Both use the same sound and timing.

Always scale the pixel art with **nearest** filtering, or it turns blurry.

## Browser sound rule

Browsers do not allow sound before the player taps or presses a key. Web builds (Godot web, Phaser, Three.js) therefore show **TAP TO START** first, then play the splash with sound. Desktop and Android Godot builds start the splash right away.

## Set up with Cursor or Claude Code

Copy this whole folder into your project, then give your AI tool the matching prompt.

**Godot 4**
```
Copy besi_splash_kit/godot/splash.gd, splash.tscn and besi_splash_kit/assets/besi_splash_sheet.png, besi_splash_sheet_portrait.png and besi_splash.ogg into res://besi_splash/.
Set res://besi_splash/splash.tscn as the main scene in project.godot (application/run/main_scene).
Set next_scene in splash.gd to our main menu scene path.
Set application/boot_splash/bg_color to #16101a so the engine boot screen matches the splash.
```

**Phaser**
```
Copy besi_splash_kit/assets/besi_splash_sheet.png, besi_splash_sheet_portrait.png, besi_splash.ogg and besi_splash.mp3 into assets/besi_splash/.
Add besi_splash_kit/phaser/SplashScene.js to the project and put SplashScene first in the game config scene list.
Set NEXT_SCENE in SplashScene.js to our main menu scene key. Make sure the game config has pixelArt: true.
```

**Three.js (or any web game)**
```
Copy besi_splash_kit/assets/besi_splash_sheet.png, besi_splash_sheet_portrait.png, besi_splash.ogg and besi_splash.mp3 into assets/besi_splash/.
Add besi_splash_kit/web/besiSplash.js. Before creating the main menu, call:
  await playBesiSplash({ base: 'assets/besi_splash/' });
```

## Sound

`assets/besi_splash.*` is your ElevenLabs sound with 0.5 s of silence added at the start, so the hits match the animation. `assets/alt/besi_splash_codemade.*` is the older sound made in code, retimed to the same hits, as a backup.

To make a new ElevenLabs version, use Sound Effects with this prompt:

> Pixel game studio logo sting. A small hammer strikes a metal anvil twice with bright ringing clangs, half a second apart, then a short sparkling three-note chime that fades out. Clean, retro, no music, no voice.

The hits must land at 0.5 s and 1.0 s after the 0.5 s silence is added, and the chime at about 1.4 s.

## Timing

| Time | Event |
|---|---|
| 0.00 s | Cat holds the hammer up |
| 0.50 s | Hit 1: sparks, "BESI" appears |
| 1.00 s | Hit 2: bigger sparks, "WORKS" appears |
| 1.42 s | "STUDIO" appears with chime |
| 2.00 s | Shine passes over the text |
| 3.00 s | Last frame, held for 0.6 s, then 0.4 s fade out |
