import { GridMixin } from "./arraygrid.js";
import { Particle } from "./particle.js";

export class Cell {
  constructor(i, j, width, height) {
    this.i = i;
    this.j = j;
    this.height = width;
    this.width = height;
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
    graphic.lineStyle(1, { h: 0, s: 0, l: 10 });
    graphic.drawRect(
      (this.j - 1) * this.height,
      (this.i - 1) * this.width,
      this.height,
      this.width,
    );
  }
}

export class Grid {
  constructor(live_rows, live_columns, width, height) {
    this.rows = live_rows + 2;
    this.columns = live_columns + 2;
    this.width = width;
    this.height = height;
    this.cell_height = height / live_rows;
    this.cell_width = width / live_columns;

    // make cells
    this.cells = GridMixin(Array).create(this.rows, this.columns);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        this.cells.setValue(
          i,
          j,
          new Cell(i, j, this.cell_width, this.cell_height),
        );
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

    // also create and insert ghost particles if needed
    let [_i, _j] = [i, j];
    if (i === 1) {
      _i = this.rows - 1;
    } else if (i === this.rows - 2) {
      _i = 0;
    }
    if (j === 1) {
      _j = this.columns - 1;
    } else if (j === this.columns - 2) {
      _j = 0;
    }
    if (_i !== i) {
      const ghost = Particle.clone(particle);
      ghost.y += this.height * Math.sign(_i - i);
      this.cells.getValue(_i, j).push(ghost);
    }
    if (_j !== j) {
      const ghost = Particle.clone(particle);
      ghost.x += this.width * Math.sign(_j - j);
      this.cells.getValue(i, _j).push(ghost);
    }
    if (_i !== i && _j !== j) {
      const ghost = Particle.clone(particle);
      ghost.x += this.width * Math.sign(_j - j);
      ghost.y += this.height * Math.sign(_i - i);
      this.cells.getValue(_i, _j).push(ghost);
    }
  }

  downsample(x, y) {
    if (x < 0 || y < 0) {
      throw new Error(`x and y must be non-negative: ${x}, ${y}`);
    }
    // input: 0 <= x <= this.w and 0 <= y <= this.h
    // output: 1 <= i <= this.rows - 2 and 1 <= j <= this.columns - 2
    return [
      Math.min(Math.floor(y / this.cell_height) + 1, this.rows - 2),
      Math.min(Math.floor(x / this.cell_width) + 1, this.columns - 2),
    ];
  }
}
