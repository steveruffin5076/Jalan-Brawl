const STORAGE_KEY = 'jalan-brawl-audio-settings';
const DEFAULTS = Object.freeze({ music: 1, effects: 1, ambience: 1, muted: false });

function browserStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export class AudioSettings {
  constructor(storage = browserStorage()) {
    this.storage = storage;
    this.listeners = new Set();
    this.values = { ...DEFAULTS };
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        for (const key of ['music', 'effects', 'ambience']) {
          if (typeof saved[key] === 'number' && Number.isFinite(saved[key])) {
            this.values[key] = Math.max(0, Math.min(1, saved[key]));
          }
        }
        if (typeof saved.muted === 'boolean') this.values.muted = saved.muted;
      }
    } catch { /* Unavailable storage or invalid data: use defaults. */ }
  }

  set(key, value) {
    if (key === 'muted') {
      if (typeof value !== 'boolean') return;
    } else if (['music', 'effects', 'ambience'].includes(key)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      value = Math.max(0, Math.min(1, value));
    } else return;
    if (this.values[key] === value) return;
    this.values[key] = value;
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.values)); } catch { /* In-memory settings still work. */ }
    for (const listener of this.listeners) listener(this.values);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const audioSettings = new AudioSettings();
