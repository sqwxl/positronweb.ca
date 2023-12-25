import {
  ColorMatrixFilter,
  Graphics,
  Rectangle,
  RenderTexture,
  TilingSprite,
} from "../pixi.mjs";
import { Vec2 } from "./vec2.js";
import { Grid } from "./grid.js";
import { Particle } from "./particle.js";

export class Engine {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.W = this.settings.W;
    this.H = this.settings.H;
    this.paused = false;

    this.renderTexture = RenderTexture.create({
      width: this.W,
      height: this.H,
    });

    this.sprite = new TilingSprite(
      this.renderTexture,
      app.screen.width,
      app.screen.height,
    );
    this.app.stage.addChild(this.sprite);

    this.canvas = new Graphics();

    this.fadeRect = new Graphics();
    this.fadeRect
      .beginFill(this.settings.BG_COLOR, this.settings.FADE_ALPHA)
      .drawRect(0, 0, this.W, this.H)
      .endFill();

    this.particles = new Array(this.settings.N)
      .fill()
      .map(
        () =>
          new Particle(
            new Vec2(Math.random() * this.W, Math.random() * this.H),
            new Vec2(Math.random() * 2 - 1, Math.random() * 2 - 1).mul(
              this.settings.C,
            ),
          ),
      );

    this.grid = new Grid(
      this.settings.GRID_ROWS,
      this.settings.GRID_COLS,
      this.W,
      this.H,
    );

    this.pairs = new Set();
    if (this.settings.APPLY_FILTERS) {
      const colorFilter = new ColorMatrixFilter();
      colorFilter.lsd(true);
      this.app.stage.filterArea = new Rectangle(0, 0, this.W, this.H);
      this.app.stage.filters = [colorFilter];
    }

    document.addEventListener("keyup", (e) => {
      if (e.key === " ") this.paused = !this.paused;
    });
  }

  run = (dt) => {
    if (this.paused) return;
    this.pairs.clear();

    this.grid.update(this.particles);

    // first pass: compute forces
    for (const cell0 of this.grid.cells) {
      if (!cell0) continue;
      if (this.settings.DRAW_BOXES) {
        cell0.draw(this.canvas);
      }
      const [i, j] = [cell0.i, cell0.j];
      for (const p0 of cell0.particles) {
        for (const dy of [-1, 0, 1]) {
          for (const dx of [-1, 0, 1]) {
            let [ii, jj] = [i + dy, j + dx];

            let [ghost_x, ghost_y] = [0, 0];
            if (ii < 0) {
              ii = this.grid.rows - 1;
              ghost_y = -1;
            } else if (ii >= this.grid.rows) {
              ii = 0;
              ghost_y = 1;
            }
            if (jj < 0) {
              jj = this.grid.cols - 1;
              ghost_x = -1;
            } else if (jj >= this.grid.cols) {
              jj = 0;
              ghost_x = 1;
            }

            const live_cell = ghost_x === 0 && ghost_y === 0;

            const cell1 = this.grid.cells.getValue(ii, jj);
            for (const p1 of cell1.particles) {
              if (p0 === p1) continue;
              if (live_cell) {
                const pair_id =
                  p0.id < p1.id ? `${p0.id}-${p1.id}` : `${p1.id}-${p0.id}`;
                if (this.pairs.has(pair_id)) continue;
                this.pairs.add(pair_id);
              }

              const f = this.compute_force_vec(p0, p1, ghost_x, ghost_y);
              if (!f) continue;

              this.apply_force(p0, f);
              if (live_cell) this.apply_force(p1, f.mul(-1));
            }
          }
        }
      }
    }

    // second pass: move particles
    this.particles.forEach((particle) => {
      this.tick(particle, dt * this.settings.SIM_SPEED);

      // boundary conditions
      if (this.settings.BOUNDARY_MODE === "bounce") this.bounce(particle);
      else if (this.settings.BOUNDARY_MODE === "wrap") this.wrap(particle);
    });

    if (this.settings.APPLY_FADE) {
      this.app.renderer.render(this.fadeRect, {
        renderTexture: this.renderTexture,
        clear: false,
      });
    }
    this.app.renderer.render(this.canvas, {
      renderTexture: this.renderTexture,
      clear: !this.settings.APPLY_FADE,
    });

    this.canvas.clear();
  };

  compute_force_vec(p0, p1, ghost_x, ghost_y) {
    const [x1, y1] = [p1.x + ghost_x * this.W, p1.y + ghost_y * this.H];
    const d = p0.p.sub(x1, y1);
    const r2 = d.mag_sq();

    if (r2 === 0 || r2 > this.settings.CUTOFF2) return;

    let f;

    if (r2 > this.settings.FORCE_THRESHOLD) {
      f = (-this.settings.K1 * p0.charge * p1.charge) / r2;
    } else {
      f = this.settings.K2 / r2;
    }

    if (this.settings.DRAW_FORCES) {
      this.draw_force(f, p0, x1, y1);
    }

    return d.mul(f); // TODO consider normalizing d
  }

  apply_force(p, f) {
    p.v = p.v.add(f).mul(this.settings.FRICTION).cap(this.settings.C);
  }

  tick(p, t) {
    this.canvas.moveTo(p.x, p.y);

    p.move(t);

    const s = p.v.mag_sq() / this.settings.C2;

    this.canvas.lineStyle({
      width: this.settings.PARTICLE_SIZE + 3 * s,
      color: {
        h: this.settings.PARTICLE_HUE + 45 * p.charge,
        s: 70 + 30 * s,
        l: 70 + 30 * s,
      },
      alpha: 1,
      cap: "round",
    });
    this.canvas.lineTo(p.x, p.y);
  }

  bounce(particle) {
    if (particle.x < 0) {
      particle.x = 0;
      particle.v.x *= -1;
    }
    if (particle.x > this.W) {
      particle.x = this.W;
      particle.v.x *= -1;
    }
    if (particle.y < 0) {
      particle.y = 0;
      particle.v.y *= -1;
    }
    if (particle.y > this.H) {
      particle.y = this.H;
      particle.v.y *= -1;
    }
  }

  wrap(particle) {
    if (particle.x < 0) particle.x = (particle.x % this.W) + this.W;
    if (particle.x > this.W) particle.x = particle.x % this.W;
    if (particle.y < 0) particle.y = (particle.y % this.H) + this.H;
    if (particle.y > this.H) particle.y = particle.y % this.H;
  }

  draw_force(f, p0, x1, y1) {
    this.canvas.lineStyle(
      1,
      {
        h: this.settings.FORCE_HUE - 45 * Math.sign(f),
        s: 100,
        l: 20,
      },
      1,
    );
    this.canvas.moveTo(p0.x, p0.y);
    this.canvas.lineTo(x1, y1);
  }
}
