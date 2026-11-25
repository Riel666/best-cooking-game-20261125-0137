// Ember & Thyme — the state machine: the shift clock, the order board,
// every station interaction, scoring and combos, win/lose, the HUD and
// the overlays. The headless self-test driver lives here too.
import {
  W, H, SHIFT_SECONDS, TARGET_SCORE, WRONG_SERVE_PENALTY,
  EXPIRED_ORDER_PENALTY, CHOP_SECONDS, GRILL_SECONDS, GRILL_BURN_AFTER,
  INGREDIENTS, formatTime,
} from './config.js';
import {
  RECIPES, recipeById, plateMatchesRecipe, findMatchingOrder,
  serveScore, starsFor, itemLabel, needLabel,
} from './recipes.js';
import {
  STATIONS, buildGrid, nearestStation, binAt, stationById,
} from './kitchen.js';
import { Player } from './player.js';
import { OrderBoard } from './orders.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { render } from './render.js';

const BIN_KEYS = { 1: 'bun', 2: 'patty', 3: 'cheese', 4: 'tomato', 5: 'lettuce', 6: 'onion' };

export class Game {
  constructor(doc) {
    this.doc = doc;
    this.canvas = doc.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.grid = buildGrid();
    this.sound = new Sound();
    this.input = new Input(this.canvas);
    this.input.onFirstGesture = () => this.sound.ensure();
    this.state = 'title';
    this.frozen = false;
    this.player = new Player(480, 360);
    this.board = new OrderBoard();
    this.score = 0;
    this.combo = 1;
    this.served = 0;
    this.lost = 0;
    this.elapsed = 0;
    this.timeLeft = SHIFT_SECONDS;
    this.grill = [null, null]; // { item, t, done, announced }
    this.chop = null; // { t }
    this.plating = []; // items on the plate resting at the plating station
    this.plateOnStation = true;
    this.particles = [];
    this.message = '';
    this.messageUntil = 0;
    this.selftest = null;
    this.stars = 0;
    this.pending = null; // { station, bin } — walk there, then use it
    this.lowTicked = new Set();
    this.ticketSig = '';
    this.ordersEl = doc.getElementById('orders');
    this.showTitle();
  }

  // ------------------------------------------------------------ lifecycle
  startGame() {
    this.state = 'play';
    this.player = new Player(480, 360);
    this.board = new OrderBoard();
    this.score = 0;
    this.combo = 1;
    this.served = 0;
    this.lost = 0;
    this.elapsed = 0;
    this.timeLeft = SHIFT_SECONDS;
    this.grill = [null, null];
    this.chop = null;
    this.plating = [];
    this.plateOnStation = true;
    this.particles = [];
    this.pending = null;
    this.lowTicked = new Set();
    this.stars = 0;
    this.hideOverlay();
    this.setMessage('Shift started — first ticket is on the board!');
    this.updateHud();
  }

  endShift() {
    this.stars = starsFor(this.score, TARGET_SCORE);
    if (this.score >= TARGET_SCORE) {
      this.state = 'win';
      this.sound.win();
      this.showWin();
    } else {
      this.state = 'lose';
      this.sound.lose();
      this.showLose();
    }
    this.updateHud();
  }

  // ------------------------------------------------------------ HUD
  plateItems() {
    if (this.player.carryingPlate) return this.player.hand.items;
    if (this.plateOnStation) return this.plating;
    return [];
  }

  updateHud() {
    const $ = (id) => this.doc.getElementById(id);
    $('timer').textContent = formatTime(this.timeLeft);
    $('timerBox').classList.toggle('low', this.timeLeft <= 30 && this.state === 'play');
    $('score').textContent = String(this.score);
    $('combo').textContent = `x${this.combo}`;
    $('target').textContent = String(TARGET_SCORE);
    // Order tickets: rebuild only when their signature changes.
    const plate = this.plateItems();
    const sig = this.board.orders.map((o) => `${o.id}:${o.recipe.id}:${Math.ceil(o.remaining)}`).join('|')
      + '#' + plate.map((i) => `${i.kind}:${i.state}`).join(',');
    if (sig !== this.ticketSig) {
      this.ticketSig = sig;
      let html = '';
      for (let i = 0; i < 3; i++) {
        const o = this.board.orders[i];
        if (!o) {
          html += '<div class="ticket empty">waiting for the next table…</div>';
          continue;
        }
        const remaining = plate.slice();
        const needs = o.recipe.needs.map((n) => {
          const idx = remaining.findIndex((it) => it.kind === n.kind && it.state === n.state);
          const done = idx !== -1;
          if (done) remaining.splice(idx, 1);
          return `<span class="${done ? 'done' : ''}">${needLabel(n)}</span>`;
        }).join(' · ');
        const frac = Math.max(0, o.remaining / o.max);
        html += `<div class="ticket"><div class="dish">${o.recipe.name} · $${o.recipe.value}</div>`
          + `<div class="needs">${needs}</div>`
          + `<div class="patience${frac < 0.3 ? ' low' : ''}" style="width:${Math.round(frac * 100)}%"></div></div>`;
      }
      this.ordersEl.innerHTML = html;
    }
  }

  setMessage(text, seconds = 4) {
    this.message = text;
    this.messageUntil = this.elapsed + seconds;
    const el = this.doc.getElementById('message');
    el.textContent = text;
  }

  // ------------------------------------------------------------ overlays
  showTitle() {
    this.state = 'title';
    const card = this.doc.getElementById('card');
    card.innerHTML = `<h2>Ember &amp; Thyme</h2>
      <p>Run the tiniest bistro in town. Tickets land on the order board — fetch
      ingredients from the counter, chop them on the board, grill the patties,
      build each dish on the plate and serve it at the window before the
      customer's patience runs out.</p>
      <p class="big">Serve ${TARGET_SCORE} points worth of food in ${formatTime(SHIFT_SECONDS)} to win the shift.</p>
      <p class="keys">WASD / arrows or click to move &middot; E or Space to use a station (hold E to chop)
      &middot; keys 1–6 grab an ingredient &middot; R restart &middot; M sound</p>
      <button id="startBtn">Start the shift</button>`;
    this.doc.getElementById('overlay').classList.remove('hidden');
    this.doc.getElementById('startBtn').addEventListener('click', () => {
      this.sound.ensure();
      this.startGame();
    });
  }

  showWin() {
    const card = this.doc.getElementById('card');
    const stars = '★'.repeat(this.stars) + '☆'.repeat(3 - this.stars);
    card.innerHTML = `<h2>Shift complete!</h2>
      <p class="big">${stars}</p>
      <p>You served <b>${this.served}</b> dishes for <b>${this.score}</b> points
      (${this.lost} ticket${this.lost === 1 ? '' : 's'} walked out). The bistro
      survives another day — the regulars are already asking for tomorrow's menu.</p>
      <button id="againBtn">Cook another shift</button>`;
    this.doc.getElementById('overlay').classList.remove('hidden');
    this.doc.getElementById('againBtn').addEventListener('click', () => this.startGame());
  }

  showLose() {
    const card = this.doc.getElementById('card');
    card.innerHTML = `<h2>The kitchen closes…</h2>
      <p>You served <b>${this.served}</b> dishes for <b>${this.score}</b> points —
      short of the <b>${TARGET_SCORE}</b> the bistro needed. ${this.lost} ticket${this.lost === 1 ? '' : 's'}
      walked out hungry. Tomorrow the regulars come back. Be quicker with the grill.</p>
      <button id="againBtn">Try the shift again</button>`;
    this.doc.getElementById('overlay').classList.remove('hidden');
    this.doc.getElementById('againBtn').addEventListener('click', () => this.startGame());
  }

  hideOverlay() {
    this.doc.getElementById('overlay').classList.add('hidden');
  }

  // ------------------------------------------------------------ update
  update(dt) {
    if (this.state !== 'play') return;
    this.elapsed += dt;
    this.timeLeft = Math.max(0, SHIFT_SECONDS - this.elapsed);
    if (this.timeLeft <= 0) {
      this.endShift();
      return;
    }
    this.board.update(dt, this.elapsed);
    for (const o of this.board.takeExpired()) {
      this.lost++;
      this.combo = 1;
      this.score = Math.max(0, this.score - EXPIRED_ORDER_PENALTY);
      this.setMessage(`A ${o.recipe.name} ticket walked out! (−${EXPIRED_ORDER_PENALTY}, combo lost)`);
      this.sound.error();
    }
    // Patience tick when a ticket drops under 10 seconds.
    for (const o of this.board.orders) {
      if (o.remaining <= 10 && !this.lowTicked.has(o.id)) {
        this.lowTicked.add(o.id);
        this.sound.tick();
      }
    }
    this.updateGrill(dt);
    this.updateChop(dt);
    this.updateParticles(dt);
    this.handleInput(dt);
    if (this.elapsed > this.messageUntil) {
      this.doc.getElementById('message').textContent = '';
    }
    this.updateHud();
  }

  updateGrill(dt) {
    let anyGrilling = false;
    for (const slot of this.grill) {
      if (!slot) continue;
      anyGrilling = true;
      slot.t += dt;
      if (!slot.done && slot.t >= GRILL_SECONDS) {
        slot.done = true;
        slot.item.state = 'grilled';
        this.sound.grillDone();
        this.setMessage('Patty grilled — grab it before it burns!');
      } else if (slot.done && slot.item.state !== 'burnt' && slot.t >= GRILL_SECONDS + GRILL_BURN_AFTER) {
        slot.item.state = 'burnt';
        this.setMessage('The patty burnt! Trash it and start over.');
        this.sound.error();
      }
    }
    if (anyGrilling) this.sound.startSizzle();
    else this.sound.stopSizzle();
  }

  updateChop(dt) {
    if (!this.chop) return;
    const near = nearestStation(this.player.x, this.player.y);
    if (!near || near.id !== 'board' || !this.input.interactHeld) {
      this.chop = null; // stepped away or let go — chopping stops
      return;
    }
    this.chop.t += dt;
    if (Math.floor(this.chop.t * 4) !== Math.floor((this.chop.t - dt) * 4)) this.sound.chop();
    if (this.chop.t >= CHOP_SECONDS) {
      this.player.hand.state = 'chopped';
      this.sound.chop();
      this.burst(this.player.x, this.player.y - 20, '#5da244');
      this.setMessage(`${itemLabel(this.player.hand)} — ready for the plate.`);
      this.chop = null;
    }
  }

  handleInput(dt) {
    const p = this.player;
    p.moving = false;
    const click = this.input.takeClick();
    if (click) {
      const station = STATIONS.find((s) =>
        click.x >= s.rect.x && click.x <= s.rect.x + s.rect.w &&
        click.y >= s.rect.y && click.y <= s.rect.y + s.rect.h);
      if (station) {
        this.pending = { station, bin: station.id === 'bins' ? binAt(click.x, click.y) : null };
        p.clickMove(station.approach.x, station.approach.y, this.grid);
      } else {
        this.pending = null;
        p.clickMove(click.x, click.y, this.grid);
      }
    }
    const { dx, dy } = this.input.axis();
    if (dx !== 0 || dy !== 0) {
      this.pending = null;
      p.steer(dx, dy, dt, this.grid);
    } else {
      p.followPath(dt, this.grid);
    }
    // Number keys grab an ingredient straight from the counter.
    for (const [key, kind] of Object.entries(BIN_KEYS)) {
      if (this.input.keys.has(key)) {
        this.input.keys.delete(key);
        const bins = stationById('bins');
        const d = Math.hypot(p.x - bins.approach.x, p.y - bins.approach.y);
        if (d < 110) this.takeIngredient(kind);
        else {
          this.pending = { station: bins, bin: kind };
          p.clickMove(bins.approach.x, bins.approach.y, this.grid);
        }
      }
    }
    if (this.pending) {
      const s = this.pending.station;
      if (Math.hypot(p.x - s.approach.x, p.y - s.approach.y) < 46) {
        const pending = this.pending;
        this.pending = null;
        this.interactAt(s, pending.bin);
      }
    }
    if (this.input.takeInteractPressed()) {
      const station = nearestStation(p.x, p.y);
      if (station) this.interactAt(station, null);
      else this.setMessage('Walk up to a station to use it.');
    }
    if (this.input.keys.has('r')) {
      this.input.keys.delete('r');
      this.startGame();
    }
    if (this.input.keys.has('m')) {
      this.input.keys.delete('m');
      this.sound.toggleMute();
      this.setMessage(this.sound.muted ? 'Sound off.' : 'Sound on.');
    }
  }

  // ------------------------------------------------------------ stations
  // One entry point for every station use: keyboard E, a click on the
  // station, a number key, and the headless self-test all come through here.
  interactAt(station, bin) {
    const p = this.player;
    if (station.id === 'bins') {
      if (bin) this.takeIngredient(bin);
      else this.setMessage('Pick an ingredient: click a bin, or press 1–6.');
      return;
    }
    if (station.id === 'grill') return this.useGrill();
    if (station.id === 'board') return this.useBoard();
    if (station.id === 'plating') return this.usePlating();
    if (station.id === 'window') return this.useWindow();
    if (station.id === 'trash') return this.useTrash();
  }

  takeIngredient(kind) {
    const p = this.player;
    if (p.hand) {
      this.setMessage('Hands full — put this down first.');
      return false;
    }
    p.hand = { kind, state: 'raw' };
    this.sound.pickup();
    this.setMessage(`${INGREDIENTS[kind].label} in hand.`);
    return true;
  }

  useGrill() {
    const p = this.player;
    // Pick up a finished (or burnt) patty first.
    const ready = this.grill.findIndex((s) => s && s.done);
    if (ready !== -1 && !p.hand) {
      const slot = this.grill[ready];
      this.grill[ready] = null;
      p.hand = slot.item;
      this.sound.pickup();
      this.setMessage(slot.item.state === 'burnt'
        ? 'Burnt patty — take it to the trash.'
        : 'Grilled patty in hand — onto the plate!');
      return;
    }
    if (p.carryingItem && p.hand.kind === 'patty' && p.hand.state === 'raw') {
      const free = this.grill.findIndex((s) => !s);
      if (free === -1) {
        this.setMessage('Both grill slots are busy.');
        return;
      }
      this.grill[free] = { item: p.hand, t: 0, done: false };
      p.hand = null;
      this.sound.place();
      this.setMessage('Patty on the grill…');
      return;
    }
    if (this.grill.some((s) => s && !s.done)) {
      this.setMessage('Patty still grilling — wait for the sizzle to settle.');
      return;
    }
    this.setMessage('The grill is for raw patties.');
  }

  useBoard() {
    const p = this.player;
    if (!p.carryingItem) {
      this.setMessage('Bring something choppable to the board: tomato, lettuce or onion.');
      return;
    }
    const prep = INGREDIENTS[p.hand.kind].prep;
    if (prep !== 'chop') {
      this.setMessage(`${INGREDIENTS[p.hand.kind].label} does not need chopping.`);
      return;
    }
    if (p.hand.state === 'chopped') {
      this.setMessage('Already chopped.');
      return;
    }
    this.chop = { t: 0 };
    this.setMessage('Chopping… hold E.');
  }

  usePlating() {
    const p = this.player;
    if (p.carryingPlate) {
      this.plating = p.hand.items;
      this.plateOnStation = true;
      p.hand = null;
      this.sound.place();
      this.setMessage('Plate back on the counter.');
      return;
    }
    if (p.carryingItem) {
      if (!this.plateOnStation) {
        this.setMessage('The plate is not here.');
        return;
      }
      this.plating.push(p.hand);
      p.hand = null;
      this.sound.place();
      this.burst(480, 500, '#f2c531');
      this.setMessage(this.plating.length >= 5
        ? 'Plate is full — serve it at the window.'
        : `${itemLabel(this.plating[this.plating.length - 1])} on the plate.`);
      return;
    }
    if (this.plateOnStation) {
      p.hand = { plate: true, items: this.plating };
      this.plating = [];
      this.plateOnStation = false;
      this.sound.pickup();
      this.setMessage('Plate in hand — serve it at the window.');
    }
  }

  useWindow() {
    const p = this.player;
    if (!p.carryingPlate) {
      this.setMessage('Bring a finished plate to the window.');
      return;
    }
    const items = p.hand.items;
    if (items.length === 0) {
      this.setMessage('The plate is empty — build a dish first.');
      return;
    }
    const order = findMatchingOrder(items, this.board.orders);
    if (!order) {
      this.score = Math.max(0, this.score - WRONG_SERVE_PENALTY);
      this.combo = 1;
      p.hand.items = [];
      this.sound.error();
      this.setMessage(`No ticket wants that dish! (−${WRONG_SERVE_PENALTY}, combo lost)`);
      return;
    }
    const gained = serveScore(order.recipe, order.remaining, order.max, this.combo);
    this.score += gained;
    this.served++;
    this.combo = Math.min(12, this.combo + 1);
    this.board.remove(order);
    p.hand.items = [];
    this.sound.ding();
    this.burst(844, 320, '#ffd98a');
    this.setMessage(`Served ${order.recipe.name}! +${gained} points.`);
  }

  useTrash() {
    const p = this.player;
    if (!p.hand) {
      this.setMessage('Nothing to throw away.');
      return;
    }
    const label = p.carryingPlate ? 'plate contents' : itemLabel(p.hand);
    p.hand = null;
    this.chop = null;
    this.sound.place();
    this.setMessage(`Tossed the ${label}.`);
  }

  // ------------------------------------------------------------ particles
  burst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 30,
        life: 0.6, color,
      });
    }
  }

  updateParticles(dt) {
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 160 * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
  }

  // ------------------------------------------------------------ draw
  draw() {
    render(this);
  }

  // ------------------------------------------------------------ self-test
  // Scripted play through the real rules (teleports + interactAt, the
  // same calls a keyboard player makes). Mode 1 serves one Sunny Burger
  // end to end; mode "burn" grills a patty and lets it burn.
  debugDrive(dt) {
    const s = this.selftest;
    if (!s || s.result) return;
    s.frames++;
    const p = this.player;
    const go = (x, y) => { p.x = x; p.y = y; p.path = []; };
    const bins = stationById('bins');
    const grill = stationById('grill');
    const board = stationById('board');
    const plating = stationById('plating');
    const win = stationById('window');
    if (s.mode === 'burn') {
      if (s.step === 0) { go(bins.approach.x, bins.approach.y); this.takeIngredient('patty'); s.step = 1; }
      else if (s.step === 1) { go(grill.approach.x, grill.approach.y); this.interactAt(grill); s.step = 2; }
      else if (s.step === 2) {
        const slot = this.grill.find((g) => g);
        if (slot && slot.item.state === 'burnt') {
          s.result = `PASS patty burnt at ${formatTime(this.elapsed)} (grill timer ${slot.t.toFixed(1)}s)`;
        } else if (s.frames > 60 * 30) s.result = 'FAIL patty never burnt in 30s';
      }
      return;
    }
    // Mode 1: serve a Sunny Burger.
    const step = s.step;
    if (step === 0) { go(bins.approach.x, bins.approach.y); this.takeIngredient('bun'); s.step = 1; }
    else if (step === 1) { go(plating.approach.x, plating.approach.y); this.interactAt(plating); s.step = 2; }
    else if (step === 2) { go(bins.approach.x, bins.approach.y); this.takeIngredient('patty'); s.step = 3; }
    else if (step === 3) { go(grill.approach.x, grill.approach.y); this.interactAt(grill); s.step = 4; }
    else if (step === 4) {
      const slot = this.grill.find((g) => g && g.done && g.item.state === 'grilled');
      if (slot) { go(grill.approach.x, grill.approach.y); this.interactAt(grill); s.step = 5; }
      else if (s.frames > 60 * 30) s.result = 'FAIL patty never finished grilling in 30s';
    }
    else if (step === 5) { go(plating.approach.x, plating.approach.y); this.interactAt(plating); s.step = 6; }
    else if (step === 6) { go(bins.approach.x, bins.approach.y); this.takeIngredient('cheese'); s.step = 7; }
    else if (step === 7) { go(plating.approach.x, plating.approach.y); this.interactAt(plating); s.step = 8; }
    else if (step === 8) { go(bins.approach.x, bins.approach.y); this.takeIngredient('tomato'); s.step = 9; }
    else if (step === 9) {
      go(board.approach.x, board.approach.y);
      this.interactAt(board);
      this.input.interactHeld = true;
      s.step = 10;
    }
    else if (step === 10) {
      if (p.hand && p.hand.state === 'chopped') {
        this.input.interactHeld = false;
        s.step = 11;
      } else if (s.frames > 60 * 30) s.result = 'FAIL tomato never chopped in 30s';
    }
    else if (step === 11) { go(plating.approach.x, plating.approach.y); this.interactAt(plating); s.step = 12; }
    else if (step === 12) { go(plating.approach.x, plating.approach.y); this.interactAt(plating); s.step = 13; }
    else if (step === 13) { go(win.approach.x, win.approach.y); this.interactAt(win); s.step = 14; }
    else if (step === 14) {
      if (this.served === 1) {
        s.result = `PASS served Sunny Burger in ${formatTime(this.elapsed)} score ${this.score}`;
      } else if (s.frames > 60 * 30) s.result = `FAIL no serve in 30s (served ${this.served}, score ${this.score})`;
    }
  }
}
