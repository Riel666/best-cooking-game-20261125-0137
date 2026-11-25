// The chef: one pair of hands, one plate's worth of patience. Moves with
// WASD/arrows or a click on the floor (BFS path), slides around counters.
import { PLAYER_SPEED, PLAYER_RADIUS } from './config.js';
import { collide, findPath } from './kitchen.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dir = 1; // facing: 1 right, -1 left
    this.moving = false;
    this.hand = null; // { kind, state } ingredient, or { plate: true, items: [...] }
    this.path = [];
    this.walkPhase = 0;
  }

  get carryingPlate() {
    return this.hand !== null && this.hand.plate === true;
  }

  get carryingItem() {
    return this.hand !== null && this.hand.plate !== true;
  }

  // Keyboard steering; returns true when a key moved the chef.
  steer(dx, dy, dt, grid) {
    const len = Math.hypot(dx, dy);
    if (len === 0) return false;
    this.path = [];
    const nx = this.x + (dx / len) * PLAYER_SPEED * dt;
    const ny = this.y + (dy / len) * PLAYER_SPEED * dt;
    const p = collide(nx, ny, PLAYER_RADIUS);
    this.x = p.x;
    this.y = p.y;
    if (dx !== 0) this.dir = dx > 0 ? 1 : -1;
    this.moving = true;
    this.walkPhase += dt * 11;
    return true;
  }

  clickMove(tx, ty, grid) {
    const path = findPath(grid, this.x, this.y, tx, ty);
    if (path.length > 1) this.path = path.slice(1);
    else if (path.length === 1) this.path = path;
  }

  followPath(dt, grid) {
    if (!this.path.length) return false;
    const target = this.path[0];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      this.path.shift();
      return this.followPath(dt, grid);
    }
    const step = PLAYER_SPEED * dt;
    const nx = this.x + (dx / d) * Math.min(step, d);
    const ny = this.y + (dy / d) * Math.min(step, d);
    const p = collide(nx, ny, PLAYER_RADIUS);
    this.x = p.x;
    this.y = p.y;
    if (dx !== 0) this.dir = dx > 0 ? 1 : -1;
    this.moving = true;
    this.walkPhase += dt * 11;
    return true;
  }
}
