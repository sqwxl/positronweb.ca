import { Application, Graphics, RenderTexture, Sprite } from "./pixi.mjs";

const N = 200;
const CUTOFF2 = Math.pow(100, 2);
const NODE_CAP = 4;
const FADE_FACTOR = 7 / 100;
const BG_COLOR = 0x000000;
const C = 40;
const C2 = C * C;
const FRICTION = 0.99;
const K1 = -20;
const K2 = 100;
const MAX_DIST2 = Math.pow(50, 2);

const app = new Application({
  antialias: false,
  width: window.innerWidth / 2,
  height: window.innerHeight / 2,
  backgroundColor: BG_COLOR,
  resolution: window.devicePixelRatio ?? 1,
});

// const blurFilter = new BlurFilter(2, 6, Filter.defaultResolution, 5)
// const colorFilter = new ColorMatrixFilter();
// colorFilter.lsd(true);
// app.stage.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
// app.stage.filters = [blurFilter, colorFilter];

const renderTexture = RenderTexture.create({
  width: app.screen.width,
  height: app.screen.height,
});

const sprite = new Sprite(renderTexture);
app.stage.addChild(sprite);

const fadeRect = new Graphics();
fadeRect
  .beginFill(BG_COLOR, FADE_FACTOR)
  .drawRect(0, 0, app.screen.width, app.screen.height)
  .endFill();

const trails = new Graphics();

let n = 0;

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

    let f = K1 * p0.charge * p1.charge / r2;
    if (r2 < MAX_DIST2) {
      // apply repelling force
      f += K2 / r2;
    }

    const a = d.mul(f);

    p0.v = p0.v.add(a);
    p1.v = p1.v.sub(a);

    p0.v = p0.v.mul(FRICTION).cap(C);
    p1.v = p1.v.mul(FRICTION).cap(C);
    p0.s = p0.v.mag2() / C2;
    p1.s = p1.v.mag2() / C2;

    if (f > 0) {
      trails.lineStyle(1, "red", 1);
    }
    else {
      trails.lineStyle(1, "blue", 1);
    }
    trails.moveTo(p0.p.x, p0.p.y);
    trails.lineTo(p1.p.x, p1.p.y);

  }

  move(t) {
    trails.moveTo(this.p.x, this.p.y);
    this.p = this.p.add(this.v.mul(t));
    this.bound();
    const color = {
      h: 45 * this.charge - 90,
      s: 50 + 50 * this.s,
      l: 50 + 20 * this.s,
    };
    trails.lineStyle({ width: 2 + 3 * this.s, color, alpha: 1, cap: "round" });
    trails.lineTo(this.p.x, this.p.y);
  }

  bound() {
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
    this.particles = [];
    this.boundary = boundary;
    this.northWest = this.northEast = this.southWest = this.southEast = null;
    // trails.lineStyle(1, 0xffffff, 0.03);
    // trails.drawRect(
    //   boundary.center.x - boundary.size.x,
    //   boundary.center.y - boundary.size.y,
    //   boundary.size.x * 2,
    //   boundary.size.y * 2,
    // );
  }

  clear() {
    this.particles = [];
    this.northWest = this.northEast = this.southWest = this.southEast = null;
  }

  insert(particle) {
    if (!this.boundary.contains(particle.p)) {
      return false;
    }
    if (this.particles.length < NODE_CAP) {
      this.particles.push(particle);
      return true;
    }
    if (!this.northWest) {
      this.subdivide();
    }
    return (
      this.northWest.insert(particle) ||
      this.northEast.insert(particle) ||
      this.southWest.insert(particle) ||
      this.southEast.insert(particle)
    );
  }

  subdivide() {
    const half = this.boundary.size.div(2);
    const minus = this.boundary.center.sub(half);
    const plus = this.boundary.center.add(half);
    this.northWest = new QuadTree(new Boundary(minus, half));
    this.northEast = new QuadTree(
      new Boundary(new Vec2(plus.x, minus.y), half),
    );
    this.southWest = new QuadTree(
      new Boundary(new Vec2(minus.x, plus.y), half),
    );
    this.southEast = new QuadTree(new Boundary(plus, half));
  }

  queryParticle(particle) {
    if (!this.boundary.contains(particle.p)) {
      return [];
    }
    const found = this.particles.filter((p) => p !== particle);
    if (this.northEast === null) {
      return found;
    }
    return found.concat(
      this.northWest.queryParticle(particle),
      this.northEast.queryParticle(particle),
      this.southWest.queryParticle(particle),
      this.southEast.queryParticle(particle),
    );
  }
}

const particles = Array(N)
  .fill()
  .map(() => new Particle());

const rootBoundary = new Boundary(
  new Vec2(renderTexture.width / 2, renderTexture.height / 2),
  new Vec2(renderTexture.width / 2, renderTexture.height / 2),
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
    p.move(dt / 10);
  }

  // app.renderer.render(fadeRect, {
  //   renderTexture,
  //   clear: false,
  // });

  app.renderer.render(trails, {
    renderTexture,
    // clear: false,
  });

  trails.clear();
});

document.getElementById("animation").appendChild(app.view);
