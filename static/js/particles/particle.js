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
    this.p.x = value;
  }

  get y() {
    return this.p.y;
  }

  set y(value) {
    this.p.y = value;
  }
}
