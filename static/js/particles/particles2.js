import {
  Application,
  BlurFilter,
  ColorMatrixFilter,
  Filter,
  Graphics,
  Rectangle,
  RenderTexture,
  Sprite,
} from "../pixi.mjs";
import { Vec2 } from "./vec2.js";

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

function pairId(p0, p1) {
  return p0.id < p1.id ? `${p0.id}-${p1.id}` : `${p1.id}-${p0.id}`;
}

const grid = new Grid(particles);
const pairs = new Set();

let paused = false;
app.ticker.add((dt) => {
  if (paused) return;
  for (const p of particles) {
    p.move(dt * SIM_SPEED);
  }

  pairs.clear();
  grid.clear().sort();

  grid.cells.forEach((cell, i) => {
    if (!cell) return;
    if (DRAW_BOXES) {
      trails.lineStyle(1, 0xffffff, 1);
      trails.drawRect(
        (i % GRID_COLS) * GRID_W,
        Math.floor(i / GRID_ROWS) * GRID_H,
        GRID_W,
        GRID_H,
      );
    }
    const neighbors = grid.neighbors(i);
    let node = cell;
    while (node) {
      for (const neighbor of neighbors) {
        if (neighbor === node.idx) continue;
        const id = pairId(particles[node.idx], particles[neighbor]);
        if (!pairs.has(id)) {
          pairs.add(id);
          Particle.update_pair(particles[node.idx], particles[neighbor]);
        }
      }
      node = node.next;
    }
  });

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
document.addEventListener("keyup", () => {
  paused = !paused;
});
