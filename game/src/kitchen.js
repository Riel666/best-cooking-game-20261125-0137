// The kitchen floor: where every station stands, what blocks movement,
// and the tile pathfinding the chef's click-to-move walks on.
import { COLS, ROWS, TILE, W, H, INGREDIENTS } from './config.js';

// Stations are counters the chef walks up to. Each has a rectangle, a
// label, and an "approach" point on the floor in front of it.
export const STATIONS = [
  {
    id: 'bins', kind: 'bins', label: 'Ingredient Counter',
    rect: { x: 24, y: 56, w: 372, h: 56 },
    approach: { x: 210, y: 148 },
    bins: ['bun', 'patty', 'cheese', 'tomato', 'lettuce', 'onion'],
  },
  {
    id: 'grill', kind: 'grill', label: 'Grill',
    rect: { x: 600, y: 56, w: 336, h: 56 },
    approach: { x: 768, y: 148 },
    slots: 2,
  },
  {
    id: 'board', kind: 'board', label: 'Chopping Board',
    rect: { x: 40, y: 292, w: 168, h: 64 },
    approach: { x: 124, y: 392 },
  },
  {
    id: 'window', kind: 'window', label: 'Serving Window',
    rect: { x: 752, y: 292, w: 184, h: 64 },
    approach: { x: 844, y: 392 },
  },
  {
    id: 'plating', kind: 'plating', label: 'Plating Counter',
    rect: { x: 380, y: 500, w: 200, h: 56 },
    approach: { x: 480, y: 464 },
  },
  {
    id: 'trash', kind: 'trash', label: 'Trash',
    rect: { x: 40, y: 500, w: 96, h: 56 },
    approach: { x: 88, y: 464 },
  },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

// Tile grid: a tile is solid when a station rect covers its centre, or it
// is outside the floor border (the room's walls).
export function buildGrid() {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const cx = c * TILE + TILE / 2;
      const cy = r * TILE + TILE / 2;
      let solid = cx < 24 || cx > W - 24 || cy < 40 || cy > H - 24;
      for (const s of STATIONS) {
        if (cx >= s.rect.x && cx <= s.rect.x + s.rect.w &&
            cy >= s.rect.y && cy <= s.rect.y + s.rect.h) solid = true;
      }
      row.push(solid);
    }
    grid.push(row);
  }
  return grid;
}

export function tileAt(grid, x, y) {
  const c = Math.floor(x / TILE);
  const r = Math.floor(y / TILE);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return true;
  return grid[r][c];
}

// Breadth-first search over walkable tiles; returns waypoints (pixel
// centres) from start to goal, or [] when unreachable.
export function findPath(grid, sx, sy, gx, gy) {
  const sc = Math.floor(sx / TILE);
  const sr = Math.floor(sy / TILE);
  const gc = Math.floor(gx / TILE);
  const gr = Math.floor(gy / TILE);
  if (grid[gr] && grid[gr][gc]) return [];
  const prev = new Map();
  const key = (c, r) => `${c},${r}`;
  const queue = [[sc, sr]];
  prev.set(key(sc, sr), null);
  while (queue.length) {
    const [c, r] = queue.shift();
    if (c === gc && r === gr) break;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (grid[nr][nc]) continue;
      if (prev.has(key(nc, nr))) continue;
      prev.set(key(nc, nr), [c, r]);
      queue.push([nc, nr]);
    }
  }
  if (!prev.has(key(gc, gr))) return [];
  const cells = [];
  let cur = [gc, gr];
  while (cur) {
    cells.unshift(cur);
    cur = prev.get(key(cur[0], cur[1]));
  }
  return cells.map(([c, r]) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }));
}

// Circle-vs-station collision: push the chef out of any station rect.
export function collide(x, y, radius) {
  let nx = x;
  let ny = y;
  for (const s of STATIONS) {
    const r = s.rect;
    const cx = Math.max(r.x, Math.min(nx, r.x + r.w));
    const cy = Math.max(r.y, Math.min(ny, r.y + r.h));
    const dx = nx - cx;
    const dy = ny - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 === 0) { ny = r.y - radius; continue; }
      const d = Math.sqrt(d2);
      nx = cx + (dx / d) * radius;
      ny = cy + (dy / d) * radius;
    }
  }
  nx = Math.max(24 + radius, Math.min(W - 24 - radius, nx));
  ny = Math.max(40 + radius, Math.min(H - 24 - radius, ny));
  return { x: nx, y: ny };
}

// The nearest station the chef can use from here (within reach of its
// approach point), or null.
export function nearestStation(x, y) {
  let best = null;
  let bestD = 92;
  for (const s of STATIONS) {
    const d = Math.hypot(x - s.approach.x, y - s.approach.y);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

// Which ingredient bin sits under a click on the counter (bins are laid
// out left to right along the counter's top edge).
export function binAt(x, y) {
  const bins = STATIONS[0];
  if (y < bins.rect.y || y > bins.rect.y + bins.rect.h) return null;
  if (x < bins.rect.x || x > bins.rect.x + bins.rect.w) return null;
  const i = Math.floor((x - bins.rect.x) / (bins.rect.w / bins.bins.length));
  return bins.bins[Math.max(0, Math.min(bins.bins.length - 1, i))];
}

export { INGREDIENTS };
