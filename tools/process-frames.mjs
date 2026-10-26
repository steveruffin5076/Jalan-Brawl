import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { configFile, listPngs, loadConfig, newest, root } from './art-common.mjs';

const toolFile = fileURLToPath(import.meta.url);

const ALPHA = 20;
const config = loadConfig();

for (const [char, spec] of Object.entries(config)) {
  const [canvasW, canvasH] = spec.canvas;
  const feetInset = spec.feetInset;
  const outDir = path.join(root, 'art', 'out', char);
  fs.mkdirSync(outDir, { recursive: true });
  const scaleFile = path.join(outDir, '_scale.json');
  const scale = await resolveScale(char, spec, scaleFile);

  const names = Object.keys(spec.anims);
  names.sort((a, b) => (a === 'idle' ? -1 : b === 'idle' ? 1 : a.localeCompare(b)));
  for (const anim of names) {
    await processAnim(char, spec, anim, scale, canvasW, canvasH, feetInset, outDir, scaleFile);
  }
}

async function resolveScale(char, spec, scaleFile) {
  const idleDir = path.join(root, 'art', 'frames', char, 'idle');
  const idleFrames = listPngs(idleDir);
  if (!idleFrames.length) {
    if (fs.existsSync(scaleFile)) return JSON.parse(fs.readFileSync(scaleFile, 'utf8')).scale;
    throw new Error(`${char} has no idle frames and no saved scale. Add art/raw/${char}/idle.mp4.`);
  }
  const idleOut = listPngs(path.join(root, 'art', 'out', char))
    .filter((file) => path.basename(file).startsWith(`${char}_idle_`));
  const fresh = idleOut.length
    && newest([...idleOut, scaleFile]) >= newest([...idleFrames, configFile()]);
  if (fresh) return JSON.parse(fs.readFileSync(scaleFile, 'utf8')).scale;

  const picked = pickIndices(idleFrames, spec.anims.idle.frames);
  const trimmed = await trimFrame(idleFrames[picked[0]]);
  const scale = spec.targetHeight / trimmed.height;
  fs.writeFileSync(scaleFile, JSON.stringify({ scale, idleHeight: trimmed.height }));
  console.log(`scale ${char}: ${scale.toFixed(4)} from idle frame 0 (${trimmed.height}px)`);
  return scale;
}

async function processAnim(char, spec, anim, scale, canvasW, canvasH, feetInset, outDir, scaleFile) {
  const frames = listPngs(path.join(root, 'art', 'frames', char, anim));
  if (!frames.length) {
    console.log(`skip ${char}/${anim}: no extracted frames`);
    return;
  }
  const want = spec.anims[anim].frames;
  const outputs = [];
  for (let i = 0; i < want; i += 1) {
    outputs.push(path.join(outDir, `${char}_${anim}_${String(i).padStart(2, '0')}.png`));
  }
  const preview = path.join(outDir, `_preview_${anim}.png`);
  const inputs = [...frames, configFile(), scaleFile];
  if (anim === 'walk') inputs.push(toolFile);
  const framesReady = outputs.every((file) => fs.existsSync(file)) && newest(outputs) >= newest(inputs);
  const previewReady = fs.existsSync(preview) && newest([preview]) >= newest(outputs);
  if (framesReady && previewReady) {
    console.log(`fresh ${char}/${anim} frames`);
    return;
  }

  const chosen = pickIndices(frames, want);
  if (chosen.length < want) {
    console.log(`warn ${char}/${anim}: clip has ${frames.length} frames, wanted ${want}`);
  }
  for (const file of listPngs(outDir)) {
    if (path.basename(file).startsWith(`${char}_${anim}_`)) fs.unlinkSync(file);
  }
  const planted = anim === 'walk';
  const prepared = [];
  for (let i = 0; i < chosen.length; i += 1) {
    const trimmed = await trimFrame(frames[chosen[i]]);
    // scaleMul: for clips made from a zoomed-out source image (e.g. bruiser slam)
    const animScale = scale * (spec.anims[anim].scaleMul || 1);
    const scaledW = Math.max(1, Math.round(trimmed.width * animScale));
    const scaledH = Math.max(1, Math.round(trimmed.height * animScale));
    const scaled = await sharp(trimmed.buffer)
      .resize(scaledW, scaledH, { fit: 'fill' })
      .png()
      .toBuffer();
    const scaledRaw = await sharp(scaled).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // Walk pins the stance (both shoes) on the spot. Each frame is trimmed on its
    // own, so that point is placed directly and is not smoothed across frames.
    // "body" keeps the chest still. The default keeps the feet centre on the line.
    let anchorX = spec.anims[anim].anchor === 'body' ? trimmed.bodyX : trimmed.feetX;
    if (planted) anchorX = stanceX(scaledRaw.data, scaledRaw.info.width, scaledRaw.info.height, scaledRaw.info.channels);
    else anchorX *= scaledW / trimmed.width;
    prepared.push({
      scaled,
      scaledW,
      scaledH,
      anchorX,
      feetY: trimmed.feetY * (scaledH / trimmed.height)
    });
  }
  const placed = [];
  for (let i = 0; i < prepared.length; i += 1) {
    const { scaled, scaledW, scaledH, anchorX, feetY } = prepared[i];
    const feetX = anchorX;
    let destX = Math.round(canvasW / 2 - feetX);
    let destY = Math.round(canvasH - feetInset - feetY);
    let cropLeft = 0;
    let cropTop = 0;
    let cropW = scaledW;
    let cropH = scaledH;
    let cut = false;
    if (destX < 0) {
      cropLeft = -destX;
      cropW -= cropLeft;
      destX = 0;
      cut = true;
    }
    if (destY < 0) {
      cropTop = -destY;
      cropH -= cropTop;
      destY = 0;
      cut = true;
    }
    if (destX + cropW > canvasW) {
      cropW = canvasW - destX;
      cut = true;
    }
    if (destY + cropH > canvasH) {
      cropH = canvasH - destY;
      cut = true;
    }
    if (cut) console.log(`warn ${char}/${anim} frame ${i}: pixels were cut off by the ${canvasW}×${canvasH} canvas`);

    const piece = cropW > 0 && cropH > 0
      ? await sharp(scaled).extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH }).png().toBuffer()
      : null;
    const file = path.join(outDir, `${char}_${anim}_${String(i).padStart(2, '0')}.png`);
    let image = sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });
    if (piece) image = image.composite([{ input: piece, left: destX, top: destY }]);
    await image.png().toFile(file);
    placed.push(file);
  }

  await writePreview(placed, preview, canvasW, canvasH, feetInset);
  console.log(`process ${char}/${anim}: ${placed.length} frames`);
}

async function trimFrame(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const box = opaqueBounds(data, info.width, info.height, info.channels);
  if (!box) throw new Error(`${file} has no opaque pixels after the green key.`);
  const trimmed = await sharp(file)
    .extract(box)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const feet = findFeet(trimmed.data, trimmed.info.width, trimmed.info.height, trimmed.info.channels);
  const buffer = await sharp(trimmed.data, {
    raw: {
      width: trimmed.info.width,
      height: trimmed.info.height,
      channels: trimmed.info.channels
    }
  }).png().toBuffer();
  return { buffer, width: trimmed.info.width, height: trimmed.info.height, ...feet };
}

function opaqueBounds(data, width, height, channels) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * channels + 3] <= ALPHA) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function findFeet(data, width, height, channels) {
  const band = Math.max(1, Math.round(height * 0.08));
  const yStart = height - band;
  // chest band (25%–45% from the top) for the "body" anchor
  const bodyTop = Math.round(height * 0.25);
  const bodyBottom = Math.round(height * 0.45);
  let sum = 0;
  let count = 0;
  let bodySum = 0;
  let bodyCount = 0;
  let lowest = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * channels + 3] <= ALPHA) continue;
      if (y > lowest) lowest = y;
      if (y >= yStart) {
        sum += x;
        count += 1;
      }
      if (y >= bodyTop && y < bodyBottom) {
        bodySum += x;
        bodyCount += 1;
      }
    }
  }
  const feetX = count ? sum / count : width / 2;
  return { feetX, bodyX: bodyCount ? bodySum / bodyCount : feetX, feetY: lowest };
}

function stanceX(data, width, height, channels) {
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width * channels;
    for (let x = 0; x < width; x += 1) {
      if (data[row + x * channels + 3] <= ALPHA) continue;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxY < 0) return width / 2;
  const band = Math.max(2, Math.round((maxY - minY + 1) * 0.12));
  const y0 = maxY - band + 1;
  let sum = 0;
  let count = 0;
  for (let y = y0; y <= maxY; y += 1) {
    const row = y * width * channels;
    for (let x = 0; x < width; x += 1) {
      if (data[row + x * channels + 3] <= ALPHA) continue;
      sum += x;
      count += 1;
    }
  }
  return count ? sum / count : width / 2;
}

function pickIndices(files, want) {
  const count = files.length;
  const total = Math.min(want, count);
  if (total <= 1) return [0];
  const seen = new Set();
  const indexes = [];
  for (let i = 0; i < total; i += 1) {
    const index = Math.round((i * (count - 1)) / (total - 1));
    if (seen.has(index)) continue;
    seen.add(index);
    indexes.push(index);
  }
  return indexes;
}

async function writePreview(frames, file, canvasW, canvasH, feetInset) {
  const sheetW = canvasW * frames.length;
  const composites = [];
  for (let i = 0; i < frames.length; i += 1) {
    composites.push({ input: frames[i], left: i * canvasW, top: 0 });
  }
  const y = canvasH - feetInset;
  const lines = frames.map((_, i) => {
    const x = i * canvasW + canvasW / 2;
    return `<line x1="${i * canvasW}" y1="${y}" x2="${(i + 1) * canvasW}" y2="${y}" stroke="#ff2a2a" stroke-width="2"/>
      <line x1="${x}" y1="0" x2="${x}" y2="${canvasH}" stroke="#ff2a2a" stroke-width="2"/>`;
  }).join('');
  const overlay = Buffer.from(
    `<svg width="${sheetW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`
  );
  const png = await sharp({
    create: {
      width: sheetW,
      height: canvasH,
      channels: 4,
      background: { r: 90, g: 94, b: 102, alpha: 1 }
    }
  }).composite([...composites, { input: overlay, left: 0, top: 0 }]).png().toBuffer();
  if (fs.existsSync(file)) fs.unlinkSync(file);
  fs.writeFileSync(file, png);
}
