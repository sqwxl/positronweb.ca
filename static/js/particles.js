import {
  Application,
  BlurFilter,
  ColorMatrixFilter,
  Filter,
  Graphics,
  Rectangle,
  RenderTexture,
  Sprite,
} from "./pixi.mjs";

// sim
const SIM_SPEED = 0.01;
const W = window.innerWidth;
const H = window.innerHeight;
const N = 100;
const CUTOFF2 = Math.pow(200, 2);
const FORCE_THRESHOLD = CUTOFF2 * 0.25;
const CELL_CAPACITY = 1;
const C = 200;
const C2 = C * C;
const FRICTION = 0.995;
const K1 = 400;
const K2 = 500;
const BOUNDARY_MODE = "wrap"; // "wrap" or "bounce"

// style
const DRAW_FORCES = true;
const DRAW_BOXES = true;
const BG_COLOR = 0x282828;
const PARTICLE_SIZE = 4;
const PARTICLE_HUE = 270;
const FORCE_HUE = PARTICLE_HUE;
const APPLY_FADE = true;
const FADE_ALPHA = 0.2;
const APPLY_FILTERS = false;

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other) {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  mul(scalar) {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  div(scalar) {
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  mag2() {
    return this.x * this.x + this.y * this.y;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  abs() {
    return new Vec2(Math.abs(this.x), Math.abs(this.y));
  }

  cap(max) {
    const mag2 = this.mag2();
    const max2 = max * max;
    if (mag2 > max2) {
      return this.mul(max2 / mag2);
    }
    return this;
  }
}

class Particle {
  constructor() {
    this.id = n++;
    this.p = new Vec2(
      Math.random() * app.screen.width,
      Math.random() * app.screen.height,
    );
    this.v = new Vec2(2 * Math.random() - 1, 2 * Math.random() - 1).mul(C);
    this.charge = 1 - 2 * Math.round(Math.random());
  }

  static update_pair(p0, p1) {
    const d = p0.p.sub(p1.p);
    const r2 = d.x * d.x + d.y * d.y;
    if (r2 === 0 || r2 > CUTOFF2) return;

    let f;

    if (r2 > FORCE_THRESHOLD) {
      f = (-K1 * p0.charge * p1.charge) / r2;
    } else {
      // always repel regardless of charge
      f = K2 / r2;
    }

    const a = d.mul(f);

    p0.v = p0.v.add(a);
    p1.v = p1.v.sub(a);

    p0.v = p0.v.mul(FRICTION).cap(C);
    p1.v = p1.v.mul(FRICTION).cap(C);
    p0.s = p0.v.mag2() / C2;
    p1.s = p1.v.mag2() / C2;

    if (DRAW_FORCES) {
      trails.lineStyle(
        1,
        { h: FORCE_HUE + 45 * Math.sign(f), s: 50, l: 30 },
        1,
      );
      trails.moveTo(p0.p.x, p0.p.y);
      trails.lineTo(p1.p.x, p1.p.y);
    }
  }

  move(t) {
    switch (BOUNDARY_MODE) {
      case "wrap":
        this.wrap();
        break;
      case "bounce":
        this.bounce();
        break;
    }
    trails.moveTo(this.p.x, this.p.y);
    this.p = this.p.add(this.v.mul(t));
    trails.lineStyle({
      width: PARTICLE_SIZE + 2 * this.s,
      color: {
        h: PARTICLE_HUE + 45 * this.charge,
        s: 50 + 50 * this.s,
        l: 50 + 30 * this.s,
      },
      alpha: 1,
      cap: "round",
    });
    trails.lineTo(this.p.x, this.p.y);
  }

  bounce() {
    if (this.p.x < 0) {
      this.p.x = 0;
      this.v.x *= -1;
    }
    if (this.p.x > renderTexture.width) {
      this.p.x = renderTexture.width;
      this.v.x *= -1;
    }
    if (this.p.y < 0) {
      this.p.y = 0;
      this.v.y *= -1;
    }
    if (this.p.y > renderTexture.height) {
      this.p.y = renderTexture.height;
      this.v.y *= -1;
    }
  }

  wrap() {
    if (this.p.x < 0) {
      this.p.x = renderTexture.width;
    }
    if (this.p.x > renderTexture.width) {
      this.p.x = 0;
    }
    if (this.p.y < 0) {
      this.p.y = renderTexture.height;
    }
    if (this.p.y > renderTexture.height) {
      this.p.y = 0;
    }
  }
}

class Boundary {
  constructor(center, size) {
    this.center = center;
    this.size = size;
  }

  contains(point) {
    const d = this.center.sub(point);
    return Math.abs(d.x) < this.size.x && Math.abs(d.y) < this.size.y;
  }
}

class QuadTree {
  constructor(boundary) {
    this.boundary = boundary;
    this.clear();
    if (DRAW_BOXES) {
      this.draw();
    }
  }

  clear() {
    this.particles = [];
    this.northWest = this.northEast = this.southWest = this.southEast = null;
  }

  draw() {
    trails.lineStyle(1, 0xffffff, 0.03);
    trails.drawRect(
      this.boundary.center.x - this.boundary.size.x,
      this.boundary.center.y - this.boundary.size.y,
      this.boundary.size.x * 2,
      this.boundary.size.y * 2,
    );
  }

  insert(particle) {
    if (!this.boundary.contains(particle.p)) return false;

    if (this.particles.length < CELL_CAPACITY) {
      this.particles.push(particle);
      return true;
    }

    if (!this.northWest) this.subdivide();

    return (
      this.northWest.insert(particle) ||
      this.northEast.insert(particle) ||
      this.southWest.insert(particle) ||
      this.southEast.insert(particle)
    );
  }

  subdivide() {
    const half = this.boundary.size.div(2);
    const northWest = this.boundary.center.sub(half);
    const southEast = this.boundary.center.add(half);
    this.northWest = new QuadTree(new Boundary(northWest, half));
    this.northEast = new QuadTree(
      new Boundary(new Vec2(southEast.x, northWest.y), half),
    );
    this.southWest = new QuadTree(
      new Boundary(new Vec2(northWest.x, southEast.y), half),
    );
    this.southEast = new QuadTree(new Boundary(southEast, half));
  }

  queryParticle(particle) {
    if (!this.boundary.contains(particle.p)) return [];

    const next = this.particles.filter((p) => p !== particle);

    if (this.northEast === null) return next;

    return next.concat(
      this.northWest.queryParticle(particle),
      this.northEast.queryParticle(particle),
      this.southWest.queryParticle(particle),
      this.southEast.queryParticle(particle),
    );
  }
}

const app = new Application({
  antialias: false,
  width: W,
  height: H,
  backgroundColor: BG_COLOR,
  resolution: window.devicePixelRatio ?? 1,
});

if (APPLY_FILTERS) {
  const blurFilter = new BlurFilter(5, 4, Filter.defaultResolution, 5);
  // const colorFilter = new ColorMatrixFilter();
  // colorFilter.lsd(true);
  app.stage.filterArea = new Rectangle(0, 0, W, H);
  app.stage.filters = [blurFilter];
}

const renderTexture = RenderTexture.create({
  width: app.screen.width,
  height: app.screen.height,
});

const sprite = new Sprite(renderTexture);
app.stage.addChild(sprite);

const fadeRect = new Graphics();
fadeRect.beginFill(BG_COLOR, FADE_ALPHA).drawRect(0, 0, W, H).endFill();

const trails = new Graphics();

let n = 0;

const particles = Array(N)
  .fill()
  .map(() => new Particle());

const rootBoundary = new Boundary(
  new Vec2(W / 2, H / 2),
  new Vec2(W / 2, H / 2),
);

function pairId(p0, p1) {
  return p0.id < p1.id ? `${p0.id}-${p1.id}` : `${p1.id}-${p0.id}`;
}

const tree = new QuadTree(rootBoundary);
const pairs = new Set();

app.ticker.add((dt) => {
  tree.clear();
  pairs.clear();

  for (const p of particles) {
    tree.insert(p);
  }

  //ticker
  for (const p of particles) {
    const neighbors = tree.queryParticle(p);
    for (const n of neighbors) {
      const id = pairId(p, n);
      if (!pairs.has(id)) {
        pairs.add(id);
        Particle.update_pair(p, n);
      }
    }
  }

  for (const p of particles) {
    p.move(dt * SIM_SPEED);
  }

  if (APPLY_FADE) {
    app.renderer.render(fadeRect, {
      renderTexture,
      clear: false,
    });
  }
  app.renderer.render(trails, {
    renderTexture,
    clear: !APPLY_FADE,
  });

  trails.clear();
});

document.getElementById("animation").appendChild(app.view);
