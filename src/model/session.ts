// One case being played: explore → map → reveal per postcard, then the case result.
// Pure state machine; the scene and the HUD only call these methods and render state.
import { distanceKm } from './geo';
import { freeLooks, sameObs, toolReading, type Observation } from './observe';
import { CountryRelief } from './relief';
import { ibexGap, pointsFor, starsFor } from './scoring';
import type { CaseDef, Place, ToolId } from './types';
import { TOOL_HE } from './terms';

export type Phase = 'explore' | 'map' | 'reveal' | 'done';

export interface PinResult {
  km: number;
  points: number;
  gap: number;
  pin: { lat: number; lon: number };
  truth: { lat: number; lon: number };
}

export interface LearnEvent {
  t: number;
  caseId: number;
  postcard: number;
  action: string;
  value?: unknown;
  outcome?: string;
  hinted: boolean;
  retry: number;
}

/** Walking budget per postcard in metres (the daylight meter). */
export const DAYLIGHT_M = 1400;

export class CaseSession {
  phase: Phase = 'explore';
  idx = 0;
  charges: number;
  readonly obs: Observation[][];
  readonly toolsUsed: ToolId[][];
  readonly pins: ({ lat: number; lon: number } | null)[];
  readonly results: PinResult[] = [];
  readonly hinted: boolean[];
  hintsUsed = 0;
  walkedM = 0;
  readonly events: LearnEvent[] = [];
  clock = 0;

  constructor(
    readonly def: CaseDef,
    readonly places: readonly Place[],
    readonly retry = 0,
  ) {
    this.charges = def.charges;
    this.obs = def.postcards.map(() => []);
    this.toolsUsed = def.postcards.map(() => []);
    this.pins = def.postcards.map(() => null);
    this.hinted = def.postcards.map(() => false);
  }

  get postcard() {
    return this.def.postcards[this.idx];
  }
  get place(): Place {
    return this.placeOf(this.idx);
  }
  placeOf(i: number): Place {
    const p = this.places.find((pl) => pl.id === this.def.postcards[i].placeId);
    if (!p) throw new Error(`unknown place ${this.def.postcards[i].placeId}`);
    return p;
  }
  get seed() {
    return `case${this.def.id}:${this.idx}`;
  }
  get daylightLeft() {
    return Math.max(0, 1 - this.walkedM / DAYLIGHT_M);
  }

  private log(action: string, value?: unknown, outcome?: string) {
    this.events.push({ t: this.clock, caseId: this.def.id, postcard: this.idx, action, value, outcome, hinted: this.hinted[this.idx], retry: this.retry });
  }

  private add(o: Observation): boolean {
    const list = this.obs[this.idx];
    if (list.some((x) => sameObs(x, o))) return false;
    list.push(o);
    return true;
  }

  /** A free look (walking up to a feature and looking at it). Only things that are really there count. */
  look(o: Observation): boolean {
    if (this.phase !== 'explore') return false;
    const allowed = freeLooks(this.place, this.postcard.night);
    if (!allowed.some((x) => sameObs(x, o))) return false;
    const added = this.add(o);
    if (added) this.log('look', o);
    return added;
  }

  canUse(tool: ToolId): { ok: boolean; reason?: string } {
    if (this.phase !== 'explore') return { ok: false, reason: 'not exploring' };
    if (this.charges <= 0) return { ok: false, reason: 'no charges' };
    if (this.toolsUsed[this.idx].includes(tool)) return { ok: false, reason: 'already used here' };
    return { ok: true };
  }

  useTool(tool: ToolId, elevM: number): Observation[] | null {
    if (!this.canUse(tool).ok) return null;
    this.charges--;
    this.toolsUsed[this.idx].push(tool);
    const got = toolReading(this.place, tool, { elevM, seed: this.seed });
    got.forEach((o) => this.add(o));
    this.log('tool', tool, JSON.stringify(got));
    return got;
  }

  walk(m: number) {
    if (this.phase === 'explore') this.walkedM = Math.min(DAYLIGHT_M, this.walkedM + Math.max(0, m));
  }

  /** Hint: a notebook question pointing at an unused intended clue. Never a region. Costs a star. */
  hint(): string | null {
    if (!this.def.hints || this.phase !== 'explore') return null;
    const intended = this.def.intended[this.idx] ?? [];
    const unused = intended.find((t) => !this.toolsUsed[this.idx].includes(t));
    const q = HINT_QUESTIONS[unused ?? 'look'];
    if (!this.hinted[this.idx]) this.hintsUsed++;
    this.hinted[this.idx] = true;
    this.log('hint', unused ?? 'look');
    return q;
  }

  openMap() {
    if (this.phase === 'explore') {
      this.phase = 'map';
      this.log('open_map');
    }
  }
  closeMap() {
    if (this.phase === 'map') this.phase = 'explore';
  }

  setPin(lat: number, lon: number) {
    if (this.phase === 'map') this.pins[this.idx] = { lat, lon };
  }

  commitPin(): PinResult | null {
    const pin = this.pins[this.idx];
    if (this.phase !== 'map' || !pin) return null;
    const truth = this.place;
    const km = distanceKm(pin.lat, pin.lon, truth.lat, truth.lon);
    const r: PinResult = { km, points: pointsFor(km), gap: ibexGap(km, this.def.starKm), pin, truth: { lat: truth.lat, lon: truth.lon } };
    this.results[this.idx] = r;
    this.phase = 'reveal';
    this.log('pin', pin, `${km.toFixed(1)} km`);
    return r;
  }

  next() {
    if (this.phase !== 'reveal') return;
    if (this.idx < this.def.postcards.length - 1) {
      this.idx++;
      this.walkedM = 0;
      this.phase = 'explore';
    } else {
      this.phase = 'done';
      this.log('case_done', this.result());
    }
  }

  result(relief?: CountryRelief) {
    const n = this.results.length;
    const avgKm = n ? this.results.reduce((a, r) => a + r.km, 0) / n : Infinity;
    let stars = starsFor(avgKm, this.def.starKm);
    const ruleOk = this.ruleOk(relief);
    if (!ruleOk) stars = Math.min(stars, 1);
    // The tutorial (unlimited charges) teaches the hint button, so it costs nothing there.
    if (this.hintsUsed > 0 && Number.isFinite(this.def.charges)) stars = Math.max(0, stars - 1);
    const points = this.results.reduce((a, r) => a + r.points, 0);
    const bonus = stars >= 2 && this.charges > 0 && Number.isFinite(this.def.charges) && this.def.charges < 50;
    return { avgKm, stars, bonus, points, ruleOk, chargesLeft: this.charges };
  }

  /** Case rules: west→east order (case 5) and the rain-shadow side of the ridge (case 10). */
  ruleOk(relief?: CountryRelief): boolean {
    if (!this.def.rule || this.results.length < this.def.postcards.length) return true;
    if (this.def.rule === 'order_west_east') {
      const truthOrder = this.results.map((r, i) => [r.truth.lon, i] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      const pinOrder = this.results.map((r, i) => [r.pin.lon, i] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      return truthOrder.join() === pinOrder.join();
    }
    if (this.def.rule === 'rain_shadow') {
      if (!relief) return true;
      return this.results.every((r) => {
        const ws = watershedLon(relief, r.truth.lat);
        return r.truth.lon > ws === r.pin.lon > watershedLon(relief, r.pin.lat);
      });
    }
    return true;
  }
}

export const HINT_QUESTIONS: Record<ToolId | 'look', string> = {
  hammer: 'מחברת השדה שואלת: הסלע כאן כהה או בהיר? קשה או מתפורר?',
  guide: 'מחברת השדה שואלת: הצמחים כאן צפופים וירוקים, או דלילים וקוצניים?',
  altimeter: 'מחברת השדה שואלת: אנחנו גבוה בהרים, ליד פני הים, או אולי מתחתיו?',
  rain: 'מחברת השדה שואלת: כמה גשם יורד כאן בשנה? מעל או מתחת ל-200 מ״מ?',
  kite: 'מחברת השדה שואלת: מה רואים מלמעלה? צורת הנוף והיישוב מסביב.',
  look: 'מחברת השדה שואלת: לאן שוקעת השמש? מה רואים באופק?',
};

/** Longitude of the main water divide at a latitude: the highest point of the mountain belt along that row. */
export function watershedLon(relief: CountryRelief, lat: number): number {
  let best = 35.2, bh = -Infinity;
  for (let lon = 34.9; lon <= 35.45; lon += 0.005) {
    let h = 0;
    for (let k = -2; k <= 2; k++) h += relief.at(lat + k * 0.01, lon);
    if (h > bh) {
      bh = h;
      best = lon;
    }
  }
  return best;
}

export function toolName(t: ToolId) {
  return TOOL_HE[t].name;
}
