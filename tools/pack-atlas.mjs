import fs from 'node:fs';
import path from 'node:path';
import { packAsync } from 'free-tex-packer-core';
import { configFile, listPngs, loadConfig, newest, root } from './art-common.mjs';

const config = loadConfig();
const atlasDir = path.join(root, 'public', 'assets', 'atlases');
fs.mkdirSync(atlasDir, { recursive: true });
const packed = [];

for (const [char, spec] of Object.entries(config)) {
  const outDir = path.join(root, 'art', 'out', char);
  const frames = listPngs(outDir).filter((file) => path.basename(file).startsWith(`${char}_`));
  if (!frames.length) {
    console.log(`skip ${char}: no processed frames`);
    continue;
  }
  const targets = ['png', 'json', 'meta.json'].map((ext) => path.join(atlasDir, `${char}.${ext}`));
  if (targets.every((file) => fs.existsSync(file)) && newest(targets) >= newest([...frames, configFile()])) {
    console.log(`fresh ${char} atlas`);
    packed.push(char);
    continue;
  }

  const images = frames.map((file) => ({
    path: path.basename(file),
    contents: fs.readFileSync(file)
  }));
  const result = await packAsync(images, {
    textureName: char,
    width: 2048,
    height: 2048,
    fixedSize: false,
    padding: 2,
    allowRotation: false,
    allowTrim: true,
    trimMode: 'trim',
    exporter: 'Phaser3',
    removeFileExtension: true,
    prependFolderName: false,
    detectIdentical: false,
    alphaThreshold: 0
  });
  const textures = result.filter((file) => file.name.endsWith('.png'));
  if (textures.length !== 1) {
    console.error(`${char} does not fit in one 2048×2048 atlas (${textures.length} pages). Lower the frame counts or the canvas size in art/anim-config.json.`);
    process.exit(1);
  }
  const png = textures[0];
  fs.writeFileSync(path.join(atlasDir, `${char}.png`), png.buffer);
  const raw = JSON.parse(result.find((file) => file.name.endsWith('.json')).buffer.toString());
  const hash = { frames: {}, meta: raw.meta || { app: 'jalan-brawl' } };
  const [canvasW, canvasH] = spec.canvas;
  const feetX = canvasW / 2;
  const feetY = canvasH - spec.feetInset;
  for (const texture of raw.textures) {
    hash.meta.image = `${char}.png`;
    hash.meta.size = texture.size;
    for (const frame of texture.frames) {
      const src = frame.spriteSourceSize;
      hash.frames[frame.filename] = {
        frame: frame.frame,
        rotated: frame.rotated,
        trimmed: frame.trimmed,
        spriteSourceSize: src,
        sourceSize: frame.sourceSize,
        // Trim drops the shared canvas, so each frame needs its own feet pivot.
        pivot: {
          x: (feetX - src.x) / src.w,
          y: (feetY - src.y) / src.h
        }
      };
    }
  }
  fs.writeFileSync(path.join(atlasDir, `${char}.json`), JSON.stringify(hash));
  const meta = {
    feetInset: spec.feetInset,
    canvas: spec.canvas,
    anims: {}
  };
  for (const [name, anim] of Object.entries(spec.anims)) {
    meta.anims[name] = { frames: anim.frames, fps: anim.fps || 8 };
  }
  fs.writeFileSync(path.join(atlasDir, `${char}.meta.json`), JSON.stringify(meta));
  console.log(`pack ${char}: ${frames.length} frames`);
  packed.push(char);
}

fs.writeFileSync(path.join(atlasDir, 'index.json'), JSON.stringify(packed));
fs.writeFileSync(path.join(root, 'src', 'data', 'atlas-index.json'), JSON.stringify(packed));
if (!packed.length) {
  console.log('nothing to pack');
}
