import { Vec2 } from "./vec2.js";

export class Particle {
  constructor(p, v, charge = null) {
    this.p = p;
    this.v = v;
    this.charge = charge ?? 1 - 2 * Math.round(Math.random());
    this.id = Math.floor(Math.random() * 1000000);
  }

  move(t) {
    this.p = this.p.add(this.v.mul(t));
  }

  get x() {
    return this.p.x;
  }

  set x(value) {
    if (isNaN(value)) throw new Error("NaN");
    this.p.x = value;
  }

  get y() {
    return this.p.y;
  }

  set y(value) {
    this.p.y = value;
  }

  static clone(particle) {
    return new Particle(
      Vec2.clone(particle.p),
      Vec2.clone(particle.v),
      particle.charge,
    );
  }
}
