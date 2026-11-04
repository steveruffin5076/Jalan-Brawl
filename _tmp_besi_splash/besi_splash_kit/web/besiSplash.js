// Besi Works Studio splash screen for any web game (Three.js, plain canvas, etc.).
// Draws the pixel-art sprite sheet on its own full-screen canvas, plays the sound,
// then removes itself and resolves the Promise so your game can start.
//
// Usage (Three.js):
//   import { playBesiSplash } from './besiSplash.js';
//   await playBesiSplash({ base: 'assets/besi_splash/' });
//   startGame(); // your Three.js setup / main menu

const COLUMNS = 6;
const FRAMES = 36;
const FPS = 12;
const HOLD_MS = 600;
const FADE_MS = 400;
const BG = '#16101a';

export function playBesiSplash({ base = 'assets/besi_splash/', parent = document.body } = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.style.cssText =
      `position:fixed;inset:0;z-index:9999;background:${BG};display:flex;` +
      'align-items:center;justify-content:center;cursor:pointer;transition:opacity ' + FADE_MS + 'ms';
    // Portrait screen (phone held upright) uses the 90x160 sheet.
    const portrait = innerHeight > innerWidth;
    const FRAME_W = portrait ? 90 : 160;
    const FRAME_H = portrait ? 160 : 90;
    const canvas = document.createElement('canvas');
    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
    canvas.style.cssText = 'image-rendering:pixelated;image-rendering:crisp-edges;max-width:100%;max-height:100%;';
    const label = document.createElement('div');
    label.textContent = 'TAP TO START';
    label.style.cssText = 'color:#f49c38;font:24px monospace;position:absolute';
    wrap.append(canvas, label);
    parent.appendChild(wrap);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const fit = () => {
      const s = Math.max(1, Math.floor(Math.min(innerWidth / FRAME_W, innerHeight / FRAME_H)));
      canvas.style.width = FRAME_W * s + 'px';
      canvas.style.height = FRAME_H * s + 'px';
    };
    fit();
    addEventListener('resize', fit);

    const img = new Image();
    img.src = base + (portrait ? 'besi_splash_sheet_portrait.png' : 'besi_splash_sheet.png');
    const audio = new Audio();
    audio.src = audio.canPlayType('audio/ogg') ? base + 'besi_splash.ogg' : base + 'besi_splash.mp3';
    audio.preload = 'auto';

    let state = 'waiting'; // waiting -> playing -> leaving
    let startTime = 0;

    const drawFrame = (f) => {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      ctx.drawImage(img, (f % COLUMNS) * FRAME_W, Math.floor(f / COLUMNS) * FRAME_H, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    };

    const finish = () => {
      if (state === 'leaving') return;
      state = 'leaving';
      wrap.style.opacity = '0';
      const v0 = audio.volume;
      const t0 = performance.now();
      const fadeAudio = () => {
        const k = Math.min(1, (performance.now() - t0) / FADE_MS);
        audio.volume = v0 * (1 - k);
        if (k < 1) requestAnimationFrame(fadeAudio);
      };
      fadeAudio();
      setTimeout(() => {
        audio.pause();
        removeEventListener('resize', fit);
        removeEventListener('keydown', onInput);
        wrap.remove();
        resolve();
      }, FADE_MS);
    };

    const tick = (now) => {
      if (state !== 'playing') return;
      const elapsed = now - startTime;
      drawFrame(Math.min(FRAMES - 1, Math.floor((elapsed / 1000) * FPS)));
      if (elapsed >= (FRAMES / FPS) * 1000 + HOLD_MS) finish();
      else requestAnimationFrame(tick);
    };

    const start = () => {
      label.remove();
      state = 'playing';
      audio.play().catch(() => {}); // plays only after a user gesture
      startTime = performance.now();
      requestAnimationFrame(tick);
    };

    // Browsers block sound until the first tap, so the first input starts the splash
    // and the second input skips it.
    function onInput() {
      if (state === 'waiting') {
        if (img.complete) start();
        else img.onload = start;
      } else if (state === 'playing') finish();
    }
    wrap.addEventListener('pointerdown', onInput);
    addEventListener('keydown', onInput);
  });
}
