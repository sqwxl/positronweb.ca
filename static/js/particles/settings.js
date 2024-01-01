// sim
const SIM_SPEED = 1;
const W = Math.min(window.innerWidth, window.innerHeight) / 2;
const H = W;
const N = 200;
const CUTOFF2 = Math.pow(100, 2);
const FORCE_THRESHOLD = CUTOFF2 * 0.4;
const C = 1000;
const FRICTION = 0.94;
const K1 = 100;
const K2 = 200;
const BOUNDARY_MODE = "wrap"; // "wrap" or "bounce"

// style
const TILE = false;
const DRAW_FORCES = false;
const DRAW_BOXES = false;
const BG_COLOR = 0x000000;
const PARTICLE_SIZE = 5;
const HUE = 270;
const HUE_SPREAD = 90;
const APPLY_FADE = false;
const FADE_ALPHA = 0.1;
const APPLY_FILTERS = false;
const ANTIALIAS = false;

export const settings = {
  SIM_SPEED,
  W,
  H,
  N,
  CUTOFF2,
  FORCE_THRESHOLD,
  C,
  FRICTION,
  K1,
  K2,
  BOUNDARY_MODE,
  ANTIALIAS,
  TILE,
  DRAW_FORCES,
  DRAW_BOXES,
  BG_COLOR,
  PARTICLE_SIZE,
  HUE,
  HUE_SPREAD,
  APPLY_FADE,
  FADE_ALPHA,
  APPLY_FILTERS,
};
