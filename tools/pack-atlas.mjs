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
  const current = outputFiles(char);
  if (current && newest(current) >= newest([...frames, configFile()])) {
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
  const textures = [];
  const [canvasW, canvasH] = spec.canvas;
  const feetX = canvasW / 2;
  const feetY = canvasH - spec.feetInset;
  for (const file of result) {
    if (!file.name.endsWith('.json')) continue;
    const raw = JSON.parse(file.buffer.toString());
    for (const texture of raw.textures || []) {
      for (const frame of texture.frames) {
        const src = frame.spriteSourceSize;
        frame.pivot = {
          x: (feetX - src.x) / (src.w || 1),
          y: (feetY - src.y) / (src.h || 1)
        };
      }
      textures.push(texture);
    }
  }
  if (!textures.length) {
    console.error(`${char} packed no pages.`);
    process.exit(1);
  }
  const written = new Set();
  for (const file of result) {
    if (!file.name.endsWith('.png')) continue;
    fs.writeFileSync(path.join(atlasDir, file.name), file.buffer);
    written.add(file.name);
  }
  const atlas = { textures, meta: { app: 'jalan-brawl' } };
  fs.writeFileSync(path.join(atlasDir, `${char}.json`), JSON.stringify(atlas));
  const meta = {
    feetInset: spec.feetInset,
    canvas: spec.canvas,
    anims: {}
  };
  for (const [name, anim] of Object.entries(spec.anims)) {
    meta.anims[name] = { frames: anim.frames, fps: anim.fps || 8 };
  }
  fs.writeFileSync(path.join(atlasDir, `${char}.meta.json`), JSON.stringify(meta));
  removeStalePages(char, written);
  console.log(`pack ${char}: ${frames.length} frames, ${textures.length} page(s)`);
  packed.push(char);
}

fs.writeFileSync(path.join(atlasDir, 'index.json'), JSON.stringify(packed));
fs.writeFileSync(path.join(root, 'src', 'data', 'atlas-index.json'), JSON.stringify(packed));
if (!packed.length) {
  console.log('nothing to pack');
}

function outputFiles(char) {
  const jsonPath = path.join(atlasDir, `${char}.json`);
  const metaPath = path.join(atlasDir, `${char}.meta.json`);
  if (!fs.existsSync(jsonPath) || !fs.existsSync(metaPath)) return null;
  let json;
  try {
    json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    return null;
  }
  if (!Array.isArray(json.textures) || !json.textures.length) return null;
  const images = [];
  for (const texture of json.textures) {
    if (!texture.image) return null;
    const imagePath = path.join(atlasDir, texture.image);
    if (!fs.existsSync(imagePath)) return null;
    images.push(imagePath);
  }
  return [jsonPath, metaPath, ...images];
}

function removeStalePages(char, written) {
  const owned = new RegExp(`^${char}(-\\d+)?\\.png$`);
  for (const file of fs.readdirSync(atlasDir)) {
    if (!owned.test(file) || written.has(file)) continue;
    fs.unlinkSync(path.join(atlasDir, file));
  }
}
