import {
  ColorMatrixFilter,
  Graphics,
  Rectangle,
  RenderTexture,
  Sprite,
  TilingSprite,
} from "../pixi.mjs";
import { Vec2 } from "./vec2.js";
import { Grid } from "./grid.js";
import { Particle } from "./particle.js";
import { cell_side_from_cutoff } from "./utils.js";

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

    if (this.settings.TILE) {
      this.sprite = new TilingSprite(
        this.renderTexture,
        app.screen.width,
        app.screen.height,
      );
    } else {
      this.sprite = new Sprite(this.renderTexture, this.W, this.H);
    }

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

    const cell_side = cell_side_from_cutoff(this.settings.CUTOFF2);

    this.grid = new Grid(
      ~~(this.H / cell_side),
      ~~(this.W / cell_side),
      this.W,
      this.H,
    );

    this.pairs = new Set();

    if (this.settings.APPLY_FILTERS) {
      const colorFilter = new ColorMatrixFilter();
      colorFilter.lsd(false);
      this.app.stage.filterArea = new Rectangle(
        0,
        0,
        app.screen.width,
        app.screen.height,
      );
      this.app.stage.filters = [colorFilter];
    }

    document.addEventListener("keyup", (e) => {
      if (e.key === " ") this.paused = !this.paused;
    });
  }

  run = (dt) => {
    if (this.paused) return;
    const _dt = dt * this.settings.SIM_SPEED;
    this.pairs.clear();

    this.grid.update(this.particles);

    // first pass: compute forces
    // loop through "live" cells
    for (let i = 1; i < this.grid.rows - 1; i++) {
      for (let j = 1; j < this.grid.columns - 1; j++) {
        const cell0 = this.grid.cells.getValue(i, j);
        if (this.settings.DRAW_BOXES) {
          cell0.draw(this.canvas);
        }
        for (const p0 of cell0.particles) {
          // loop through neighboring cells
          for (let ii = i - 1; ii <= i + 1; ii++) {
            for (let jj = j - 1; jj <= j + 1; jj++) {
              const cell1 = this.grid.cells.getValue(ii, jj);

              for (const p1 of cell1.particles) {
                if (p0 === p1) continue;

                const pair_id =
                  p0.id < p1.id ? `${p0.id}-${p1.id}` : `${p1.id}-${p0.id}`;

                if (this.pairs.has(pair_id)) continue;

                this.pairs.add(pair_id);

                const dv = this.get_dv(p0, p1, _dt);

                if (!dv) continue;

                this.accelerate(p0, dv);

                // only apply force to p1 if it's not a ghost particle
                if (
                  ii > 0 &&
                  ii < this.grid.rows - 1 &&
                  jj > 0 &&
                  jj < this.grid.columns - 1
                )
                  this.accelerate(p1, dv.mul(-1));
              }
            }
          }
        }
      }
    }

    // second pass: move particles
    this.particles.forEach((particle) => {
      this.tick(particle, dt);

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

  get_dv(p0, p1, dt) {
    const d = p0.p.sub(p1.p);

    const r2 = d.mag_sq();

    if (r2 === 0 || r2 > this.settings.CUTOFF2) return;

    let f;

    if (r2 > this.settings.FORCE_THRESHOLD) {
      f = (-this.settings.K1 * p0.charge * p1.charge) / r2;
    } else {
      f = this.settings.K2 / r2;
    }

    if (this.settings.DRAW_FORCES) {
      this.draw_force(f, p0, p1);
    }

    return d.normalize().mul(f).mul(dt);
  }

  accelerate(p, dv) {
    p.v = p.v.add(dv);
    p.v = p.v.mul(this.settings.FRICTION).cap(this.settings.C);
  }

  tick(p, t) {
    this.canvas.moveTo(p.x, p.y);

    p.move(t);

    const s = p.v.mag_sq() / this.settings.C / this.settings.C;

    this.canvas.lineStyle({
      width: this.settings.PARTICLE_SIZE + 3 * s,
      color: {
        h: this.settings.HUE + this.settings.HUE_SPREAD * p.charge,
        s: 100,
        l: 50,
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

  draw_force(f, p0, p1) {
    this.canvas.lineStyle(2, {
      h: this.settings.HUE - this.settings.HUE_SPREAD * Math.sign(f),
      s: 100,
      l: 8,
    });
    this.canvas.moveTo(p0.x, p0.y);
    this.canvas.lineTo(p1.x, p1.y);
  }
}
