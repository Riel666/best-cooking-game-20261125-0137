// Recipes and orders: the pure rules of the bistro. No DOM here, so the
// node smoke test can import this file and prove the logic on its own.
//
// An item is { kind, state } — state is 'raw', 'chopped', 'grilled' or
// 'burnt'. A recipe's needs list the exact items a plate must hold.
import { INGREDIENTS } from './config.js';

export const RECIPES = [
  {
    id: 'sunny',
    name: 'Sunny Burger',
    value: 180,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'cheese', state: 'raw' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'garden',
    name: 'Garden Salad',
    value: 140,
    needs: [
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
      { kind: 'onion', state: 'chopped' },
    ],
  },
  {
    id: 'melt',
    name: 'Cheesy Melt',
    value: 200,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'cheese', state: 'raw' },
      { kind: 'cheese', state: 'raw' },
    ],
  },
  {
    id: 'gardenburger',
    name: 'Garden Burger',
    value: 220,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'thyme',
    name: 'Thyme Special',
    value: 260,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'grilled' },
      { kind: 'cheese', state: 'raw' },
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'onion', state: 'chopped' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function itemKey(item) {
  return `${item.kind}:${item.state}`;
}

// The plate matches a recipe when its items are exactly the recipe's
// needs, in any order (duplicates count — two cheeses need two cheeses).
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = plate.map(itemKey).sort();
  const want = recipe.needs.map(itemKey).sort();
  return have.every((k, i) => k === want[i]);
}

export function findMatchingOrder(plate, orders) {
  // Serve the order whose patience is shortest first — the one most at risk.
  const sorted = [...orders].sort((a, b) => a.remaining - b.remaining);
  for (const order of sorted) {
    if (plateMatchesRecipe(plate, order.recipe)) return order;
  }
  return null;
}

// Score for serving an order: its value, a patience bonus for serving
// early, and the combo multiplier (combo counts consecutive serves).
export function serveScore(recipe, patienceLeft, patienceMax, combo) {
  const early = Math.max(0, patienceLeft / patienceMax);
  const mult = Math.min(3, 1 + 0.25 * (combo - 1));
  return Math.round((recipe.value + 40 * early) * mult);
}

export function starsFor(score, target) {
  if (score >= target * 1.75) return 3;
  if (score >= target * 1.33) return 2;
  if (score >= target) return 1;
  return 0;
}

// Pick the next recipe: weighted so early orders stay simple, later ones
// can be anything; never repeat the same recipe twice in a row.
export function pickRecipe(random, phaseIndex, lastId) {
  const pool = RECIPES.filter((r) => phaseIndex > 0 || r.needs.length <= 4);
  let pick = pool[Math.floor(random() * pool.length)];
  if (pool.length > 1 && pick.id === lastId) {
    pick = pool[(pool.indexOf(pick) + 1) % pool.length];
  }
  return pick;
}

export function itemLabel(item) {
  const base = INGREDIENTS[item.kind].label;
  if (item.state === 'chopped') return `Chopped ${base}`;
  if (item.state === 'grilled') return `Grilled ${base}`;
  if (item.state === 'burnt') return `Burnt ${base}`;
  return base;
}

export function needLabel(need) {
  const base = INGREDIENTS[need.kind].label;
  if (need.state === 'chopped') return `Chopped ${base}`;
  if (need.state === 'grilled') return `Grilled ${base}`;
  return base;
}
