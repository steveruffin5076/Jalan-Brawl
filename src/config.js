/** Display and stage constants. Speeds and combat numbers live in data JSON. */
export const DISPLAY = {
  width: 1280,
  height: 720,
  backgroundColor: '#142033'
};

export const FLOOR = {
  top: 470,
  bottom: 700
};

/** Inset from a screen edge. The camera adds its scroll when a fight is locked. */
export const STAGE = {
  left: 48,
  right: 1232
};

export const HERO_START = {
  x: 180,
  y: 600
};

export const INPUT = {
  deadZone: 0.15,
  maxDeltaMs: 50
};

export const TOUCH = {
  joystickX: 150,
  joystickY: 540,
  joystickRadius: 80,
  button: 80,
  attackButton: 112,
  pauseButton: 72
};

/** Shadow shrinks toward minScale as z approaches fadeHeight. */
export const SHADOW = {
  height: 22,
  minScale: 0.55,
  fadeHeight: 220
};

/** The pause key that opened the menu must not close it on the same press. */
export const UI = {
  pauseGraceMs: 250
};
