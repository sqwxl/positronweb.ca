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

const controls = document.getElementById("controls");

for (const [setting, value] of Object.entries(settings)) {
  const input = document.createElement("input");
  input.id = setting;
  switch (typeof defaults[setting]) {
    case "number":
      input.type = "number";
      input.step = value === Math.round(value) ? 1 : 0.01;
      input.value = value;
      break;
    case "boolean":
      input.type = "checkbox";
      input.checked = value;
      break;
    default:
      break;
  }

  input.onchange = (ev) => {
    const value = ev.target.value;
    if (typeof defaults[setting] === "number") {
      settings[setting] = Number(value);
    } else if (typeof defaults[setting] === "boolean") {
      settings[setting] = ev.target.checked;
    }
  };

  const label = document.createElement("label");
  label.innerText = setting;
  label.htmlFor = setting;

  controls.append(label, input, document.createElement("br"));
}
