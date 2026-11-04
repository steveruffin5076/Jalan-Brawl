import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { configFile, ffmpeg, listPngs, loadConfig, newest, parseHex, root, toKeyColor } from './art-common.mjs';

const config = loadConfig();

for (const [char, spec] of Object.entries(config)) {
  for (const [anim, animSpec] of Object.entries(spec.anims)) {
    const clip = path.join(root, 'art', 'raw', char, `${anim}.mp4`);
    if (!fs.existsSync(clip)) {
      console.log(`skip ${char}/${anim}: no clip at art/raw/${char}/${anim}.mp4`);
      continue;
    }
    const outDir = path.join(root, 'art', 'frames', char, anim);
    const existing = listPngs(outDir);
    if (existing.length && newest(existing) >= newest([clip, configFile()])) {
      console.log(`fresh ${char}/${anim} frames`);
      continue;
    }
    fs.mkdirSync(outDir, { recursive: true });
    for (const file of existing) fs.unlinkSync(file);

    const trim = animSpec.trim || [0, null];
    const key = await sampleKey(clip, trim[0] || 0, spec.key);
    const fps = spec.extractFps;
    const filter = [
      `fps=${fps}`,
      `colorkey=${key.hex}:${spec.key.similarity}:${spec.key.blend}`,
      'despill=type=green',
      'format=rgba'
    ].join(',');
    const args = ['-y'];
    if (trim[0]) args.push('-ss', String(trim[0]));
    if (trim[1] != null) args.push('-to', String(trim[1]));
    args.push('-i', clip, '-vf', filter, '-pix_fmt', 'rgba', path.join(outDir, '%03d.png'));
    await ffmpeg(args);
    const count = listPngs(outDir).length;
    console.log(`extract ${char}/${anim}: ${count} frames, key ${key.hex}${key.note}`);
  }
}

async function sampleKey(clip, start, key) {
  const sample = path.join(os.tmpdir(), `jalan-key-${process.pid}.png`);
  const args = ['-y'];
  if (start) args.push('-ss', String(start));
  args.push('-i', clip, '-frames:v', '1', sample);
  await ffmpeg(args);
  const meta = await sharp(sample).metadata();
  const size = Math.min(10, meta.width, meta.height);
  const { data, info } = await sharp(sample)
    .extract({ left: 0, top: 0, width: size, height: size })
    .raw()
    .toBuffer({ resolveWithObject: true });
  fs.unlinkSync(sample);

  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = info.width * info.height;
  const channels = info.channels;
  for (let i = 0; i < pixels; i += 1) {
    r += data[i * channels];
    g += data[i * channels + 1];
    b += data[i * channels + 2];
  }
  const sampled = {
    r: Math.round(r / pixels),
    g: Math.round(g / pixels),
    b: Math.round(b / pixels)
  };
  const configured = parseHex(key.color);
  const delta = Math.max(
    Math.abs(sampled.r - configured.r),
    Math.abs(sampled.g - configured.g),
    Math.abs(sampled.b - configured.b)
  );
  if (delta > key.sampleThreshold) {
    return {
      hex: toKeyColor(sampled),
      note: ` (sampled; config was ${key.color})`
    };
  }
  return { hex: key.color, note: '' };
}
