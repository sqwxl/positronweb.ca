export const presets = [
  {
    name: "default",
    settings: {
      N: 200,
      // W: ~~(Math.min(window.innerWidth, window.innerHeight) / 2),
      // H: ~~(Math.min(window.innerWidth, window.innerHeight) / 2),
      FRICTION: 0.99,
      K1: 1000,
      K2: 2000,
      C: 700,
      PARTICLE_SIZE: 10,
      // APPLY_FILTERS: true,
      APPLY_FADE: true,
      // DRAW_FORCES: true,
      // DRAW_BOXES: true,
      SIM_SPEED: 0.1,
      BOUNDARY_MODE: "bounce",
    },
  },
];
