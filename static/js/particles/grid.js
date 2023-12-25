import { GridMixin } from "./arraygrid.js";

export class Cell {
  constructor(i, j, w, h) {
    this.i = i;
    this.j = j;
    this.w = w;
    this.h = h;
    this.particles = [];
  }

  empty() {
    this.particles.length = 0;
  }

  push(el) {
    this.particles.push(el);
  }

  draw(graphic) {
    if (this.particles.length === 0) return;
    graphic.lineStyle(1, 0xffffff, 0.3);
    graphic.drawRect(this.j * this.w, this.i * this.h, this.w, this.h);
  }
}

export class Grid {
  constructor(rows, cols, w, h) {
    this.rows = rows;
    this.cols = cols;
    this.w = w;
    this.h = h;
    this.cell_w = w / cols;
    this.cell_h = h / rows;

    // make cells
    this.cells = GridMixin(Array).create(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this.cells.setValue(i, j, new Cell(i, j, this.cell_w, this.cell_h));
      }
    }
  }

  update(elements) {
    this.clear().sort(elements);
  }

  clear() {
    this.cells.forEach((cell) => cell.empty());
    return this;
  }

  sort(particles) {
    for (const p of particles) {
      this.insert(p);
    }
  }

  insert(particle) {
    let [i, j] = this.downsample(particle.x, particle.y);
    this.cells.getValue(i, j).push(particle);
  }

  downsample(x, y) {
    if (x < 0 || y < 0) {
      throw new Error(`x and y must be non-negative: ${x}, ${y}`);
    }
    // 0 <= x <= this.w
    // 0 <= y <= this.h
    return [
      Math.min(this.rows - 1, Math.floor(y / this.cell_h)),
      Math.min(this.cols - 1, Math.floor(x / this.cell_w)),
    ];
  }
}
