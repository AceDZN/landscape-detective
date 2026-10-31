import { readFileSync } from 'node:fs';
import { CASES } from '../src/data/cases.ts';
import { PLACES } from '../src/data/places.ts';
import { freeLooks, toolReading, type Observation } from '../src/model/observe.ts';
import { CountryRelief, PatchRelief, int16FromBuffer } from '../src/model/relief.ts';
import type { CaseDef, Place, ToolId } from '../src/model/types.ts';

export const relief = new CountryRelief(int16FromBuffer(readFileSync('public/terrain/israel.bin')));

const patches = new Map<string, PatchRelief>();
export function patchOf(p: Place): PatchRelief {
  let hit = patches.get(p.id);
  if (!hit) {
    hit = new PatchRelief(int16FromBuffer(readFileSync(`public/terrain/places/${p.id}.bin`)), p.lat, p.lon);
    patches.set(p.id, hit);
  }
  return hit;
}

export function place(id: string): Place {
  const p = PLACES.find((x) => x.id === id);
  if (!p) throw new Error(`no place ${id}`);
  return p;
}

/** What a careful player learns at postcard i of a case: free looks plus the intended tools. */
export function intendedObs(def: CaseDef, i: number, tools: readonly ToolId[] = def.intended[i]): Observation[] {
  const pc = def.postcards[i];
  const pl = place(pc.placeId);
  const elevM = patchOf(pl).centre();
  const obs: Observation[] = [...freeLooks(pl, pc.night)];
  for (const t of tools) obs.push(...toolReading(pl, t, { elevM, seed: `case${def.id}:${i}` }));
  return obs;
}

export { CASES, PLACES };
