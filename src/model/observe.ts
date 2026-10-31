// What the player can learn at a place: free looks and field-tool readings.
import { hash01 } from './geo';
import { CULTURE_HE, LANDFORM_HE, ROCK_HE, TOOL_HE, VEG_HE } from './terms';
import type { CultureSign, Landform, Place, Rock, ToolId, Vegetation } from './types';

export type Observation =
  | { kind: 'rock'; rock: Rock }
  | { kind: 'veg'; veg: Vegetation }
  | { kind: 'alt'; m: number }
  | { kind: 'rain'; mm: number }
  | { kind: 'landform'; landform: Landform }
  | { kind: 'culture'; sign: CultureSign };

/** Seen only from the kite camera (extent of a settlement). */
export const KITE_ONLY_CULTURE: readonly CultureSign[] = ['dense_town', 'sparse_town'];
/** Signs of a global landscape: they look the same everywhere, so they locate nothing. */
export const GLOBAL_SIGNS: readonly CultureSign[] = ['glass_towers', 'chain_stores'];

export const ALT_STEP = 50;
export const RAIN_ERR = 0.2;

export function altimeterReading(elevM: number): number {
  return Math.round(elevM / ALT_STEP) * ALT_STEP;
}

/** Rain gauge: the yearly average ±20 %, deterministic per postcard seed, rounded to 10 mm. */
export function rainReading(place: Place, seed: string): number {
  const err = (hash01(`${seed}:${place.id}:rain`) * 2 - 1) * RAIN_ERR;
  return Math.max(10, Math.round((place.rainMm * (1 + err)) / 10) * 10);
}

/** Free looks: what walking and looking can reveal without spending a charge. At night only the sea is heard. */
export function freeLooks(place: Place, night = false): Observation[] {
  if (night) return place.landforms.includes('sea_west') ? [{ kind: 'landform', landform: 'sea_west' }] : [];
  return [
    ...place.landforms.map((landform): Observation => ({ kind: 'landform', landform })),
    ...place.culture.filter((s) => !KITE_ONLY_CULTURE.includes(s)).map((sign): Observation => ({ kind: 'culture', sign })),
  ];
}

export function toolReading(place: Place, tool: ToolId, ctx: { elevM: number; seed: string }): Observation[] {
  switch (tool) {
    case 'hammer':
      return [{ kind: 'rock', rock: place.rock }];
    case 'guide':
      return [{ kind: 'veg', veg: place.vegetation }];
    case 'altimeter':
      return [{ kind: 'alt', m: altimeterReading(ctx.elevM) }];
    case 'rain':
      return [{ kind: 'rain', mm: rainReading(place, ctx.seed) }];
    case 'kite':
      return [
        ...place.landforms.map((landform): Observation => ({ kind: 'landform', landform })),
        ...place.culture.map((sign): Observation => ({ kind: 'culture', sign })),
      ];
  }
}

export function sameObs(a: Observation, b: Observation): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Notebook line in Workbook terms, e.g. "סלע: בזלת". Numbers are returned separately for LTR spans. */
export function notebookLine(o: Observation): { label: string; value: string; num?: string } {
  switch (o.kind) {
    case 'rock':
      return { label: TOOL_HE.hammer.verb, value: ROCK_HE[o.rock] };
    case 'veg':
      return { label: TOOL_HE.guide.verb, value: VEG_HE[o.veg] };
    case 'alt':
      if (o.m === 0) return { label: TOOL_HE.altimeter.verb, value: 'בערך בגובה פני הים', num: '0 מ׳' };
      return { label: TOOL_HE.altimeter.verb, value: o.m < 0 ? 'מתחת לפני הים' : 'מעל פני הים', num: `${o.m < 0 ? '−' : ''}${Math.abs(o.m)} מ׳` };
    case 'rain':
      return { label: TOOL_HE.rain.verb, value: 'בערך', num: `${o.mm} מ״מ` };
    case 'landform':
      return { label: 'נוף', value: LANDFORM_HE[o.landform] };
    case 'culture':
      return { label: 'סימן תרבות', value: CULTURE_HE[o.sign] };
  }
}
