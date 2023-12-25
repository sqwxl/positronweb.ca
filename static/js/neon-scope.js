import {
  Application,
  BlurFilter,
  ColorMatrixFilter,
  Filter,
  Graphics,
  Rectangle,
  RenderTexture,
  Sprite,
} from './pixi.mjs';

const TAU = Math.PI * 2;
const N = 200;
const R_RATIO = 4 / 7;
const SPEED_FACTOR = 5 / 1000;
const FADE_FACTOR = 7 / 100;
const BG_COLOR = 0x000000;
const NEON_WIDTH = 8;

const R0 = Math.min(window.innerWidth, window.innerHeight) / 2.5 * R_RATIO;
const R1 = Math.min(window.innerWidth, window.innerHeight) / 2.5 * (1 - R_RATIO);
const R2 = R1 / 2;

const SINE_PARAMS = [
  [R0, 1, 1],
  [R1, 3, 2],
  [R2, 2, 5]
]

function xy(t, offset) {
  return SINE_PARAMS.reduce((result, [r, a, b]) => [
    result[0] + r * Math.cos(a * t + b * offset),
    result[1] + r * Math.sin(a * t + b * offset),
  ], [0, 0]);
}

const OFFSETS = Array(N).fill().map((_, i) => TAU * i / N);

const points = OFFSETS.map(o => [...xy(0, o)]);

const app = new Application({
  antialias: true,
  width: window.innerWidth,
  height: window.innerHeight,
  resizeTo: window,
  backgroundColor: BG_COLOR,
  resolution: window.devicePixelRatio ?? 1,
});

const trails = new Graphics();
trails.position.set(app.screen.width / 2, app.screen.height / 2);

const renderTexture = RenderTexture.create({
  width: app.screen.width,
  height: app.screen.height
});

const sprite = new Sprite(renderTexture);
app.stage.addChild(sprite);

const fadeRect = new Graphics();
fadeRect.beginFill(BG_COLOR, FADE_FACTOR)
  .drawRect(0, 0, app.screen.width, app.screen.height)
  .endFill();

const blurFilter = new BlurFilter(12, 4, Filter.defaultResolution, 5)
const colorFilter = new ColorMatrixFilter();
colorFilter.lsd(false);
app.stage.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
app.stage.filters = [blurFilter, colorFilter];

let elapsed = 0;
app.ticker.add((delta) => {
  elapsed += delta;

  const t = elapsed * SPEED_FACTOR;
  const [x0, y0] = points[0];

  trails.moveTo(x0, y0);

  for (const [i, point] of points.entries()) {

    const color = {
      h: 260 + 15 * Math.sin(OFFSETS[i]),
      s: 100,
      l: 50,
    }

    trails.lineStyle(NEON_WIDTH, color, 1);

    if (i < N - 1) {
      trails.lineTo(...points[i + 1]);
    } else {
      trails.lineTo(x0, y0);
    }

    [point[0], point[1]] = xy(t, OFFSETS[i]);
  }

  app.renderer.render(fadeRect, {
    renderTexture,
    clear: false,
  });

  app.renderer.render(trails, {
    renderTexture,
    clear: false,
  });

  trails.clear();
});

document.getElementById("animation").appendChild(app.view);
