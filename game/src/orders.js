// The order board: tickets arrive, their patience drains, and an order
// left too long walks out. Pure logic — no DOM — so the smoke test can
// drive it in node.
import { MAX_ORDERS, phaseFor } from './config.js';
import { pickRecipe } from './recipes.js';

export class OrderBoard {
  constructor(random) {
    this.random = random || Math.random;
    this.orders = []; // { id, recipe, remaining, max, served }
    this.nextId = 1;
    this.spawnIn = 2.5; // first ticket arrives quickly
    this.lastRecipeId = null;
    this.expired = []; // orders that just walked out (consumed by game)
    this.phaseIndex = 0;
  }

  update(dt, elapsed) {
    const phase = phaseFor(elapsed);
    this.phaseIndex = elapsed < 60 ? 0 : elapsed < 120 ? 1 : 2;
    for (const o of this.orders) o.remaining -= dt;
    const dead = this.orders.filter((o) => o.remaining <= 0);
    if (dead.length) {
      this.expired.push(...dead);
      this.orders = this.orders.filter((o) => o.remaining > 0);
    }
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.orders.length < MAX_ORDERS) {
      const recipe = pickRecipe(this.random, this.phaseIndex, this.lastRecipeId);
      this.lastRecipeId = recipe.id;
      this.orders.push({
        id: this.nextId++,
        recipe,
        remaining: phase.patience,
        max: phase.patience,
      });
      this.spawnIn = phase.spawnGap * (0.85 + this.random() * 0.3);
    } else if (this.spawnIn <= 0) {
      this.spawnIn = 2;
    }
  }

  takeExpired() {
    const out = this.expired;
    this.expired = [];
    return out;
  }

  remove(order) {
    this.orders = this.orders.filter((o) => o.id !== order.id);
  }
}
