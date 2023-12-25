// sim
const SIM_SPEED = 1;
const W = window.innerHeight;
const H = window.innerHeight;
const N = 200;
const CUTOFF2 = Math.pow(W / 10, 2);
const FORCE_THRESHOLD = CUTOFF2 * 0.4;
const C = 1000;
const C2 = C * C;
const FRICTION = 0.94;
const K1 = 100;
const K2 = 200;
const BOUNDARY_MODE = "wrap"; // "wrap" or "bounce"
const CELL_W = Math.sqrt(CUTOFF2);
const CELL_H = CELL_W;
const GRID_COLS = Math.ceil(W / CELL_W);
const GRID_ROWS = Math.ceil(H / CELL_H);

// style
const DRAW_FORCES = false;
const DRAW_BOXES = false;
const BG_COLOR = 0x000000;
const PARTICLE_SIZE = 5;
const PARTICLE_HUE = 270;
const FORCE_HUE = PARTICLE_HUE;
const APPLY_FADE = false;
const FADE_ALPHA = 0.5;
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
  C2,
  FRICTION,
  K1,
  K2,
  BOUNDARY_MODE,
  CELL_W,
  CELL_H,
  GRID_COLS,
  GRID_ROWS,
  ANTIALIAS,
  DRAW_FORCES,
  DRAW_BOXES,
  BG_COLOR,
  PARTICLE_SIZE,
  PARTICLE_HUE,
  FORCE_HUE,
  APPLY_FADE,
  FADE_ALPHA,
  APPLY_FILTERS,
};
