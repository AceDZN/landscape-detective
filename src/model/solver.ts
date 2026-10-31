// The solver: which places in Israel are consistent with a set of observations,
// and where a careful detective should pin. Used by the tests to prove every
// case, by the daily-case generator, and by the reveal to light the zone.
import { CITIES, BELT_ZONES } from '../data/zones';
import { distanceKm, inPoly } from './geo';
import { GLOBAL_SIGNS, type Observation } from './observe';
import { CountryRelief } from './relief';
import { COUNTRY } from './relief-spec';
import { ARID_MM, MED_MM, landformsAt, rainAt, rockAt } from './world';
import type { Vegetation } from './types';

export const SOLVER_STEP = 0.01;
export const ALT_TOL_M = 110;
export const CITY_KM = 7;
export const SEA_WEST_KM = 22;

export interface Cell {
  lat: number;
  lon: number;
  elev: number;
  rain: number;
  rock: ReturnType<typeof rockAt>;
  landforms: ReturnType<typeof landformsAt>;
  seaWestKm: number;
}

let cache: { relief: CountryRelief; cells: Cell[] } | null = null;

/** Longitude of the open-sea edge west of each country-grid row (the Kinneret and Dead Sea are lakes, not the sea). */
let coastCache: { relief: CountryRelief; lon: number[] } | null = null;
function coastLonByRow(relief: CountryRelief): number[] {
  if (coastCache?.relief === relief) return coastCache.lon;
  const out: number[] = [];
  for (let r = 0; r < COUNTRY.rows; r++) {
    let edge = -Infinity;
    for (let c = 0; c < COUNTRY.cols; c++) {
      const l = CountryRelief.lonOf(c);
      if (l > 35.0) break;
      if (relief.cell(r, c) < -2) edge = l;
    }
    out.push(edge);
  }
  coastCache = { relief, lon: out };
  return out;
}

/** Distance (km) due west to the open sea along the same latitude. */
function seaWestKm(relief: CountryRelief, lat: number, lon: number): number {
  const r = Math.round((COUNTRY.north - lat) / COUNTRY.step);
  const edge = coastLonByRow(relief)[Math.max(0, Math.min(COUNTRY.rows - 1, r))];
  if (!Number.isFinite(edge) || edge > lon) return edge > lon ? 0 : Infinity;
  return distanceKm(lat, lon, lat, edge);
}

/** Land cells inside the play area (the belt zones), on a 0.01° grid. */
export function cells(relief: CountryRelief): Cell[] {
  if (cache && cache.relief === relief) return cache.cells;
  const out: Cell[] = [];
  for (let lat = 29.45; lat <= 33.4; lat += SOLVER_STEP) {
    for (let lon = 34.2; lon <= 35.9; lon += SOLVER_STEP) {
      if (!BELT_ZONES.some((z) => inPoly(lon, lat, z.poly))) continue;
      const elev = relief.at(lat, lon);
      out.push({ lat, lon, elev, rain: rainAt(lat, lon), rock: rockAt(lat, lon), landforms: landformsAt(lat, lon), seaWestKm: seaWestKm(relief, lat, lon) });
    }
  }
  cache = { relief, cells: out };
  return out;
}

function vegFits(v: Vegetation, c: Cell): boolean {
  switch (v) {
    case 'maquis':
      return c.rain >= MED_MM * 0.85;
    case 'batha':
      return c.rain >= ARID_MM * 0.85 && c.rain < MED_MM * 1.15;
    case 'dune':
      return c.rock === 'sand' || c.landforms.includes('dunes');
    case 'acacia':
      return c.rain < 110;
    case 'bare':
      return c.rain < 120;
    case 'desert':
    case 'oasis':
      return c.rain < ARID_MM * 1.15;
  }
}

export function fits(o: Observation, c: Cell): boolean {
  switch (o.kind) {
    case 'rock':
      return c.rock === o.rock;
    case 'veg':
      return vegFits(o.veg, c);
    case 'alt':
      return Math.abs(c.elev - o.m) <= ALT_TOL_M;
    case 'rain':
      return c.rain >= o.mm / 1.25 && c.rain <= o.mm / 0.75;
    case 'landform':
      if (o.landform === 'sea_west') return c.seaWestKm <= SEA_WEST_KM;
      return c.landforms.includes(o.landform);
    case 'culture': {
      if (GLOBAL_SIGNS.includes(o.sign)) return true;
      const towns = CITIES.filter((t) => t.culture.includes(o.sign));
      if (!towns.length) return true;
      return towns.some((t) => distanceKm(c.lat, c.lon, t.lat, t.lon) <= CITY_KM);
    }
  }
}

export interface Solution {
  feasible: Cell[];
  pin: { lat: number; lon: number } | null;
}

/** Feasible cells and the pin that minimises the mean distance to them (approximate geometric median). */
export function solve(relief: CountryRelief, obs: readonly Observation[]): Solution {
  const feasible = cells(relief).filter((c) => obs.every((o) => fits(o, c)));
  if (!feasible.length) return { feasible, pin: null };
  let lat = 0, lon = 0;
  for (const c of feasible) {
    lat += c.lat;
    lon += c.lon;
  }
  lat /= feasible.length;
  lon /= feasible.length;
  // Weiszfeld iterations toward the geometric median, then snap to the nearest feasible cell.
  for (let it = 0; it < 30; it++) {
    let nx = 0, ny = 0, den = 0;
    for (const c of feasible) {
      const d = Math.max(0.3, distanceKm(lat, lon, c.lat, c.lon));
      nx += c.lat / d;
      ny += c.lon / d;
      den += 1 / d;
    }
    lat = nx / den;
    lon = ny / den;
  }
  let best = feasible[0], bd = Infinity;
  for (const c of feasible) {
    const d = distanceKm(lat, lon, c.lat, c.lon);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  // Only snap when the median falls outside the region (e.g. a ring-shaped zone).
  return { feasible, pin: bd < 4 ? { lat, lon } : { lat: best.lat, lon: best.lon } };
}
