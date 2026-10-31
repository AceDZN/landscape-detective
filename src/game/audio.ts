// Tiny procedural sound kit (WebAudio), started after the first gesture.
export class Sfx {
  ctx: AudioContext | null = null;
  muted = false;
  private amb: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

  unlock() {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
    } catch {
      this.ctx = null;
    }
  }

  private env(freq: number, dur: number, type: OscillatorType, vol = 0.15, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.2, hp = 800) {
    if (!this.ctx || this.muted) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    s.connect(f).connect(g).connect(this.ctx.destination);
    s.start();
  }

  click() {
    this.env(660, 0.06, 'triangle', 0.08);
  }
  hammer() {
    this.noise(0.12, 0.35, 1500);
    this.env(180, 0.15, 'square', 0.06, -80);
  }
  write() {
    this.noise(0.25, 0.06, 3000);
    setTimeout(() => this.env(880, 0.08, 'sine', 0.06), 200);
  }
  notice() {
    this.env(740, 0.09, 'sine', 0.08);
    setTimeout(() => this.env(988, 0.12, 'sine', 0.08), 80);
  }
  pin() {
    this.env(220, 0.12, 'triangle', 0.18, -120);
    this.noise(0.05, 0.15, 2500);
  }
  whoosh() {
    this.noise(0.9, 0.12, 400);
  }
  tick() {
    this.env(1200, 0.025, 'square', 0.03);
  }
  fanfare(stars: number) {
    const notes = [523, 659, 784, 1046].slice(0, Math.max(1, stars + 1));
    notes.forEach((n, i) => setTimeout(() => this.env(n, 0.25, 'triangle', 0.12), i * 140));
  }
  bleat(happy = false) {
    this.env(happy ? 520 : 380, 0.35, 'sawtooth', 0.05, happy ? 120 : -140);
    setTimeout(() => this.env(happy ? 560 : 340, 0.25, 'sawtooth', 0.04, happy ? 80 : -100), 180);
  }
  kite() {
    this.noise(1.2, 0.08, 1200);
  }

  /** Ambient bed: waves near the sea, wind elsewhere, crickets at night. */
  ambience(kind: 'sea' | 'wind' | 'night' | 'town' | null) {
    if (!this.ctx) return;
    if (this.amb) {
      this.amb.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      const old = this.amb.src;
      setTimeout(() => old.stop(), 1200);
      this.amb = null;
    }
    if (!kind || this.muted) return;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * 4, sr);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      b = 0.97 * b + 0.03 * w;
      const t = i / sr;
      const swell = kind === 'sea' ? 0.5 + 0.5 * Math.sin(t * Math.PI * 0.5) ** 2 : kind === 'wind' ? 0.6 + 0.4 * Math.sin(t * 1.3) : 1;
      d[i] = kind === 'night' ? (Math.sin(t * 2 * Math.PI * 4400) * (Math.sin(t * 2 * Math.PI * 30) > 0.6 ? 0.08 : 0) * (Math.floor(t * 2) % 2)) + b * 0.3 : b * 3 * swell;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(kind === 'town' ? 0.05 : 0.12, this.ctx.currentTime, 0.8);
    src.connect(gain).connect(this.ctx.destination);
    src.start();
    this.amb = { src, gain };
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (m) this.ambience(null);
  }
}
