// Ember & Thyme — every tuning number in one place.
export const W = 960;
export const H = 640;
export const TILE = 40;
export const COLS = 24;
export const ROWS = 16;

export const SHIFT_SECONDS = 180;
export const TARGET_SCORE = 1500;
export const MAX_ORDERS = 3;
export const WRONG_SERVE_PENALTY = 50;
export const EXPIRED_ORDER_PENALTY = 25;

// Patience (seconds) and spawn gap per service phase of the shift.
export const PHASES = [
  { until: 60, patience: 52, spawnGap: 15 },
  { until: 120, patience: 44, spawnGap: 12 },
  { until: 999, patience: 36, spawnGap: 9 },
];

export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 3.0;
export const GRILL_BURN_AFTER = 5.0;

export const PLAYER_SPEED = 215;
export const PLAYER_RADIUS = 14;

// Ingredient catalogue: label, colour, what prep it needs (null = ready as is).
export const INGREDIENTS = {
  bun:     { label: 'Bun',     color: '#e8b96a', prep: null },
  patty:   { label: 'Patty',   color: '#8a5a3b', prep: 'grill' },
  cheese:  { label: 'Cheese',  color: '#f2c531', prep: null },
  tomato:  { label: 'Tomato',  color: '#d9392b', prep: 'chop' },
  lettuce: { label: 'Lettuce', color: '#5da244', prep: 'chop' },
  onion:   { label: 'Onion',   color: '#b678c2', prep: 'chop' },
};

export function phaseFor(elapsed) {
  for (const p of PHASES) if (elapsed < p.until) return p;
  return PHASES[PHASES.length - 1];
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
