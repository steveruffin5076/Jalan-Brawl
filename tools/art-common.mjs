import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function configFile() {
  return path.join(root, 'art', 'anim-config.json');
}

export function loadConfig() {
  return JSON.parse(fs.readFileSync(configFile(), 'utf8'));
}

export function listPngs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.png'))
    .sort()
    .map((name) => path.join(dir, name));
}

/** Newest mtime, or 0 when any path is missing. */
export function newest(paths) {
  let max = 0;
  for (const item of paths) {
    if (!item || !fs.existsSync(item)) return 0;
    max = Math.max(max, fs.statSync(item).mtimeMs);
  }
  return max;
}

export function parseHex(text) {
  const hex = String(text).replace(/^0x/i, '').replace('#', '');
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16)
  };
}

export function toKeyColor(rgb) {
  const channel = (value) => value.toString(16).padStart(2, '0');
  return `0x${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
}

export function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { windowsHide: true });
    let err = '';
    proc.stderr.on('data', (chunk) => {
      err += chunk.toString();
    });
    proc.on('error', () => {
      reject(new Error('ffmpeg was not found. Install it and make sure it is on PATH.'));
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `ffmpeg exited ${code}`));
    });
  });
}
