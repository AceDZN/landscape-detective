// The authoritative simplified geography of Israel: rock, belt, rain, climate,
// visible landforms and natural vegetation at any point. Driven only by the
// zone data in src/data/zones.ts and the bundled relief. No Three.js here.
import { BELT_ZONES, CITIES, FEATURE_ZONES, RAIN_STATIONS, ROCK_ZONES } from '../data/zones';
import { distanceKm, inPoly } from './geo';
import type { Belt, Climate, Landform, Rock, Vegetation } from './types';

/** Workbook israel-climate: the aridity line (קו הצחיחות) is ~200 mm; Mediterranean north of a transition strip. */
export const ARID_MM = 200;
export const MED_MM = 400;

export function rockAt(lat: number, lon: number): Rock {
  let rock: Rock = 'limestone';
  for (const z of ROCK_ZONES) if (inPoly(lon, lat, z.poly)) rock = z.rock;
  return rock;
}

export function beltAt(lat: number, lon: number): Belt | null {
  let belt: Belt | null = null;
  for (const z of BELT_ZONES) if (inPoly(lon, lat, z.poly)) belt = z.belt;
  return belt;
}

/** Inverse-distance-weighted yearly rain (mm) from the 6 nearest stations (planar km; fine at Israel's scale). */
export function rainAt(lat: number, lon: number): number {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180), ky = 110.95;
  const bestD: number[] = [], bestM: number[] = [];
  for (const s of RAIN_STATIONS) {
    const dx = (s.lon - lon) * kx, dy = (s.lat - lat) * ky;
    const d2 = dx * dx + dy * dy;
    if (bestD.length < 6 || d2 < bestD[bestD.length - 1]) {
      let i = bestD.length;
      while (i > 0 && bestD[i - 1] > d2) i--;
      bestD.splice(i, 0, d2);
      bestM.splice(i, 0, s.mm);
      if (bestD.length > 6) {
        bestD.pop();
        bestM.pop();
      }
    }
  }
  if (bestD[0] < 0.25) return bestM[0];
  let num = 0, den = 0;
  for (let i = 0; i < bestD.length; i++) {
    const w = 1 / bestD[i];
    num += w * bestM[i];
    den += w;
  }
  return num / den;
}

export function climateOf(mm: number): Climate {
  return mm >= MED_MM ? 'mediterranean' : mm >= ARID_MM ? 'steppe' : 'desert';
}

export function landformsAt(lat: number, lon: number): Landform[] {
  const out: Landform[] = [];
  for (const z of FEATURE_ZONES) if (inPoly(lon, lat, z.poly) && !out.includes(z.landform)) out.push(z.landform);
  return out;
}

/**
 * Natural vegetation from rain, rock, altitude and landforms (the biome rule).
 * The same rule drives the scene's plants, so the look follows the geography.
 */
export function vegetationOf(mm: number, rock: Rock, elevM: number, landforms: readonly Landform[]): Vegetation {
  if (rock === 'marl_salt' && mm < 100) return 'bare';
  if (rock === 'sand' || landforms.includes('dunes')) return 'dune';
  if (mm >= MED_MM) return 'maquis';
  if (mm >= ARID_MM) return 'batha';
  if (mm < 80 && elevM < 700 && (rock === 'granite' || landforms.includes('wadi') || landforms.includes('granite_peaks'))) return 'acacia';
  return 'desert';
}

export function nearestCity(lat: number, lon: number) {
  let best = CITIES[0], bd = Infinity;
  for (const c of CITIES) {
    const d = distanceKm(lat, lon, c.lat, c.lon);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return { city: best, km: bd };
}

/** Visual parameters for the scene, all derived from geography. */
export interface Biome {
  vegetation: Vegetation;
  /** Plants per 100 m² near the player. */
  plantDensity: number;
  treeShare: number;
  groundColor: number;
  rockColor: number;
  grassColor: number;
  /** 0..1 how green the hills read. */
  greenness: number;
}

const ROCK_COLORS: Record<Rock, [number, number]> = {
  limestone: [0xd9c79e, 0xe8dcc0],
  chalk: [0xe8e2d0, 0xf2eee2],
  basalt: [0x4a4440, 0x2b2a2b],
  kurkar: [0xc79a6b, 0xb98656],
  sand: [0xe9d6a9, 0xd8bf8c],
  granite: [0xb0654a, 0x8f4a38],
  loess: [0xc9ac82, 0xb89a72],
  marl_salt: [0xd9d2c0, 0xf3f0e8],
  sandstone: [0xb87a5a, 0xa35f45],
};

export function biomeOf(mm: number, rock: Rock, elevM: number, landforms: readonly Landform[], vegetation?: Vegetation): Biome {
  const veg = vegetation ?? vegetationOf(mm, rock, elevM, landforms);
  const greenness = Math.max(0, Math.min(1, (mm - 120) / 700));
  const [ground, rockC] = ROCK_COLORS[rock];
  const density: Record<Vegetation, number> = { maquis: 9, batha: 4, desert: 0.9, acacia: 0.5, dune: 1.6, oasis: 7, bare: 0.05 };
  const trees: Record<Vegetation, number> = { maquis: 0.35, batha: 0.05, desert: 0, acacia: 0.25, dune: 0.02, oasis: 0.45, bare: 0 };
  const grass = greenness > 0.5 ? 0x7f9a4a : greenness > 0.25 ? 0xa7a560 : 0xc2ac78;
  return { vegetation: veg, plantDensity: density[veg], treeShare: trees[veg], groundColor: ground, rockColor: rockC, grassColor: grass, greenness };
}
