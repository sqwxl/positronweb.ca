export class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other, y = null) {
    const [_x, _y] = y === null ? [other.x, other.y] : [other, y];

    return new Vec2(this.x - _x, this.y - _y);
  }

  mul(scalar) {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  div(scalar) {
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  mag_sq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.sqrt(this.mag_sq());
  }

  normalize() {
    return this.div(this.mag());
  }

  abs() {
    return new Vec2(Math.abs(this.x), Math.abs(this.y));
  }

  cap(max) {
    const mag2 = this.mag_sq();
    const max2 = max * max;
    if (mag2 > max2) {
      return this.mul(max2 / mag2);
    }
    return this;
  }

  static clone(vec) {
    return new Vec2(vec.x, vec.y);
  }
}
