// One frame of the bistro: wooden floor, the counters with their
// ingredients, the grill with its patties, the chopping board, the plate,
// the serving window, and the chef with whatever is in their hands.
import { W, H, TILE, INGREDIENTS, GRILL_SECONDS, GRILL_BURN_AFTER, CHOP_SECONDS } from './config.js';
import { STATIONS } from './kitchen.js';
import { itemLabel } from './recipes.js';

const FLOOR_A = '#7a5233';
const FLOOR_B = '#6e4a2d';

function drawIngredient(ctx, kind, state, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c98f3d';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.28, r * 0.8, r * 0.3, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f7e3b0';
    for (const [sx, sy] of [[-r * 0.4, -r * 0.3], [0, -r * 0.45], [r * 0.4, -r * 0.3]]) {
      ctx.beginPath(); ctx.arc(sx, sy, r * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = state === 'burnt' ? '#241a12' : state === 'grilled' ? '#5e3a22' : '#9a6a4a';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    if (state === 'grilled') {
      ctx.strokeStyle = '#3c2412'; ctx.lineWidth = 2;
      for (const ox of [-r * 0.45, 0, r * 0.45]) {
        ctx.beginPath(); ctx.moveTo(ox, -r * 0.5); ctx.lineTo(ox, r * 0.5); ctx.stroke();
      }
    }
    if (state === 'burnt') {
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.4); ctx.lineTo(r * 0.5, r * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.4); ctx.lineTo(-r * 0.5, r * 0.4); ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f2c531';
    ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(0, -r * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9a400';
    for (const [hx, hy] of [[-r * 0.3, r * 0.25], [r * 0.25, r * 0.1], [0, -r * 0.35]]) {
      ctx.beginPath(); ctx.arc(hx, hy, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'tomato') {
    ctx.fillStyle = state === 'chopped' ? '#e0564a' : '#d9392b';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill();
    if (state === 'chopped') {
      ctx.fillStyle = '#f08377';
      ctx.beginPath(); ctx.arc(-r * 0.3, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.35, r * 0.1, r * 0.35, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#5da244';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.85, r * 0.3, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = '#5da244';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.ellipse(-r * 0.4 + i * r * 0.4, 0, r * 0.45, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#7cbf5e';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.7, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'onion') {
    ctx.fillStyle = '#b678c2';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8e4f9e'; ctx.lineWidth = 1.5;
    for (const rr of [0.6, 0.35]) {
      ctx.beginPath(); ctx.arc(0, 0, r * rr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#7cbf5e';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.9, r * 0.12, r * 0.3, 0.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4ede0';
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9b896'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.72, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
  const n = items.length;
  items.forEach((item, i) => {
    const ox = n === 1 ? 0 : (i - (n - 1) / 2) * r * 0.85;
    const oy = -r * 0.12 - (n - i - 1) * 2;
    drawIngredient(ctx, item.kind, item.state, ox, oy, r * 0.42);
  });
  ctx.restore();
}

function drawStation(ctx, s, game) {
  const r = s.rect;
  ctx.save();
  // Counter body.
  ctx.fillStyle = '#8a6a44';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#a8825a';
  ctx.fillRect(r.x, r.y, r.w, 10);
  ctx.strokeStyle = '#5d4226'; ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  // Label.
  ctx.fillStyle = '#fff3dd';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (s.id === 'bins') {
    const bw = r.w / s.bins.length;
    s.bins.forEach((kind, i) => {
      const cx = r.x + bw * (i + 0.5);
      ctx.fillStyle = i % 2 ? '#966f45' : '#8a6a44';
      ctx.fillRect(r.x + bw * i + 2, r.y + 2, bw - 4, r.h - 4);
      drawIngredient(ctx, kind, 'raw', cx, r.y + r.h / 2 - 6, 13);
      ctx.fillStyle = '#fff3dd';
      ctx.font = '11px Georgia, serif';
      ctx.fillText(INGREDIENTS[kind].label, cx, r.y + r.h - 8);
    });
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('Ingredients — click a bin, or press 1–6', r.x + r.w / 2, r.y - 12);
  } else if (s.id === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
    for (let gx = r.x + 20; gx < r.x + r.w - 8; gx += 14) {
      ctx.beginPath(); ctx.moveTo(gx, r.y + 10); ctx.lineTo(gx, r.y + r.h - 10); ctx.stroke();
    }
    game.grill.forEach((slot, i) => {
      if (!slot) return;
      const cx = r.x + r.w * (0.28 + i * 0.44);
      const cy = r.y + r.h / 2;
      drawIngredient(ctx, 'patty', slot.item.state, cx, cy, 16);
      // Doneness ring: fills while grilling, red when about to burn.
      const frac = slot.done
        ? 1 - Math.max(0, (slot.t - GRILL_SECONDS) / GRILL_BURN_AFTER)
        : slot.t / GRILL_SECONDS;
      ctx.strokeStyle = slot.done ? (frac < 0.4 ? '#ff5a4e' : '#58b368') : '#ffd98a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('Grill', r.x + r.w / 2, r.y - 12);
  } else if (s.id === 'board') {
    ctx.fillStyle = '#c9a06a';
    ctx.fillRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
    if (game.chop) {
      const frac = game.chop.t / CHOP_SECONDS;
      ctx.fillStyle = '#5da244';
      ctx.fillRect(r.x + 10, r.y + r.h - 14, (r.w - 20) * frac, 6);
      ctx.fillStyle = '#3a2a18';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.fillText('Chopping…', r.x + r.w / 2, r.y + r.h / 2 + 8);
    } else {
      ctx.fillStyle = '#5d4226';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText('Chopping Board', r.x + r.w / 2, r.y + r.h / 2);
    }
  } else if (s.id === 'plating') {
    if (game.plateOnStation) drawPlate(ctx, game.plating, r.x + r.w / 2, r.y + r.h / 2, 30);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('Plating', r.x + r.w / 2, r.y - 12);
  } else if (s.id === 'window') {
    ctx.fillStyle = '#2e2118';
    ctx.fillRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('SERVING WINDOW', r.x + r.w / 2, r.y + r.h / 2 - 8);
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#c9a';
    ctx.fillText('bring the finished plate here', r.x + r.w / 2, r.y + r.h / 2 + 12);
  } else if (s.id === 'trash') {
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3dd';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText('Trash', r.x + r.w / 2, r.y + r.h / 2);
  }
  ctx.restore();
}

function drawChef(ctx, game) {
  const p = game.player;
  const bob = p.moving ? Math.sin(p.walkPhase) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f4ede0';
  ctx.beginPath(); ctx.arc(0, 2, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3f7d4e';
  ctx.fillRect(-11, -2, 22, 14);
  // Head + chef hat.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(0, -16, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.ellipse(0, -24, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -26, 22, 6);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#241a12';
  ctx.beginPath(); ctx.arc(p.dir * 3 - 3, -17, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.dir * 3 + 3, -17, 1.6, 0, Math.PI * 2); ctx.fill();
  // What is in the chef's hands, held out to the side so it stays visible.
  if (p.carryingPlate) {
    drawPlate(ctx, p.hand.items, p.dir * 22, 10, 17);
  } else if (p.carryingItem) {
    drawIngredient(ctx, p.hand.kind, p.hand.state, p.dir * 22, 10, 12);
  }
  // Chopping knife flash while chopping.
  if (game.chop) {
    ctx.strokeStyle = '#dfe6ea'; ctx.lineWidth = 3;
    const kx = p.dir * 14;
    ctx.beginPath(); ctx.moveTo(kx - 8, -6); ctx.lineTo(kx + 8, -18); ctx.stroke();
  }
  ctx.restore();
  // Interaction prompt ring around the nearest station.
  const near = game.pending ? game.pending.station : null;
  if (near) {
    ctx.save();
    ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.strokeRect(near.rect.x - 4, near.rect.y - 4, near.rect.w + 8, near.rect.h + 8);
    ctx.restore();
  }
}

export function render(game) {
  const ctx = game.ctx;
  // Floor: checkerboard wood.
  for (let r = 0; r < H / TILE; r++) {
    for (let c = 0; c < W / TILE; c++) {
      ctx.fillStyle = (r + c) % 2 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  // Wall border.
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, 0, W, 40);
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillRect(0, 0, 24, H);
  ctx.fillRect(W - 24, 0, 24, H);
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— EMBER & THYME BISTRO —', W / 2, 26);

  for (const s of STATIONS) drawStation(ctx, s, game);
  drawChef(ctx, game);

  // Particles.
  for (const pt of game.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / 0.6);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Hand label: what the chef carries, drawn under the chef.
  const p = game.player;
  if (p.hand) {
    ctx.fillStyle = 'rgba(20,12,6,0.75)';
    const label = p.carryingPlate
      ? (p.hand.items.length ? `Plate: ${p.hand.items.map(itemLabel).join(' + ')}` : 'Empty plate')
      : itemLabel(p.hand);
    ctx.font = '12px Georgia, serif';
    const w = ctx.measureText(label).width + 12;
    const lx = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, p.x));
    ctx.fillRect(lx - w / 2, p.y + 24, w, 18);
    ctx.fillStyle = '#fff3dd';
    ctx.fillText(label, lx, p.y + 37);
  }

  // Pending walk target.
  if (game.pending) {
    const t = game.pending.station.approach;
    ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t.x - 14, t.y); ctx.lineTo(t.x + 14, t.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t.x, t.y - 14); ctx.lineTo(t.x, t.y + 14); ctx.stroke();
  }
}
