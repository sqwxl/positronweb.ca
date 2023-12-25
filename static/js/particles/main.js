import { Application } from "../pixi.mjs";
import { Engine } from "./engine.js";
import { presets } from "./presets.js";
import { settings as defaults } from "./settings.js";

const settings = Object.assign(defaults, presets[0].settings);

const app = new Application({
  antialias: settings.ANTIALIAS,
  width: window.innerWidth,
  height: window.innerWidth,
  backgroundColor: settings.BG_COLOR,
  resolution: window.devicePixelRatio ?? 1,
});

const engine = new Engine(app, settings);

app.ticker.add(engine.run);

document.getElementById("animation").appendChild(app.view);
