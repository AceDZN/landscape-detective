// Saved progress and anonymous local learning events (localStorage only).
import type { LearnEvent } from '../model/session';

interface Best {
  stars: number;
  bonus: boolean;
  points: number;
}
interface Data {
  cases: Record<number, Best>;
  daily?: Record<string, { stars: number; points: number }>;
  retries?: Record<number, number>;
  muted?: boolean;
  reduced?: boolean;
}

const KEY = 'landscape-detective-v1';
const EVENTS = 'landscape-detective-events-v1';

export class Progress {
  data: Data = { cases: {} };
  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { cases: {}, ...JSON.parse(raw) };
    } catch {
      /* private mode: keep in memory */
    }
  }
  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  }
  best(id: number): Best | undefined {
    return this.data.cases[id];
  }
  set(p: Partial<Data>) {
    Object.assign(this.data, p);
    this.save();
  }
  bumpRetry(id: number) {
    this.data.retries = { ...this.data.retries, [id]: (this.data.retries?.[id] ?? 0) + 1 };
    this.save();
  }
  record(id: number, stars: number, bonus: boolean, points: number, events: LearnEvent[]) {
    const prev = this.data.cases[id];
    this.data.cases[id] = { stars: Math.max(stars, prev?.stars ?? 0), bonus: bonus || !!prev?.bonus, points: Math.max(points, prev?.points ?? 0) };
    this.save();
    this.log(events);
  }
  recordDaily(key: string, stars: number, points: number, events: LearnEvent[]) {
    const prev = this.data.daily?.[key];
    this.data.daily = { ...this.data.daily, [key]: { stars: Math.max(stars, prev?.stars ?? 0), points: Math.max(points, prev?.points ?? 0) } };
    this.save();
    this.log(events);
  }
  private log(events: LearnEvent[]) {
    try {
      const old = JSON.parse(localStorage.getItem(EVENTS) ?? '[]') as LearnEvent[];
      localStorage.setItem(EVENTS, JSON.stringify([...old, ...events].slice(-2000)));
    } catch {
      /* ignore */
    }
  }
}
