// Synthesized WebAudio sound, no audio files: a chop thock, grill sizzle,
// the serve bell, a wrong-order buzz, the patience tick and the win tune.
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzle = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, gain, filterFreq) {
    if (!this.ctx || this.muted) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 1800;
    const g = this.ctx.createGain();
    g.gain.value = gain || 0.15;
    src.connect(filter).connect(g).connect(this.ctx.destination);
    src.start();
  }

  chop() { this.noise(0.09, 0.22, 900); this.tone(180, 0.08, 'triangle', 0.1); }
  pickup() { this.tone(520, 0.07, 'sine', 0.08); }
  place() { this.tone(340, 0.08, 'triangle', 0.1); this.noise(0.05, 0.08, 1200); }
  ding() { this.tone(880, 0.35, 'sine', 0.14); this.tone(1320, 0.4, 'sine', 0.09, 0.07); }
  error() { this.tone(160, 0.25, 'sawtooth', 0.09, 0, 110); }
  tick() { this.tone(980, 0.05, 'square', 0.05); }
  grillDone() { this.tone(660, 0.12, 'sine', 0.1); this.tone(990, 0.16, 'sine', 0.1, 0.1); }

  startSizzle() {
    if (!this.ctx || this.muted || this.sizzle) return;
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2500;
    const g = this.ctx.createGain();
    g.gain.value = 0.035;
    src.connect(filter).connect(g).connect(this.ctx.destination);
    src.start();
    this.sizzle = { src, g };
  }

  stopSizzle() {
    if (!this.sizzle) return;
    try { this.sizzle.src.stop(); } catch { /* already stopped */ }
    this.sizzle = null;
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.12, i * 0.13));
  }

  lose() {
    const notes = [392, 330, 262];
    notes.forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.1, i * 0.16));
  }
}
