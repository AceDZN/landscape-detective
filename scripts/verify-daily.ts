// Verifies which places can join the daily-case pool: with free looks plus the
// daily clue set (hammer, altimeter, rain), the solver's pin must land inside
// the daily 3-star radius for every rain-gauge seed it can get. Writes src/data/daily-pool.json.
//   npx tsx scripts/verify-daily.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { PLACES } from '../src/data/places.ts';
import { DAILY_CLUES, DAILY_STAR_KM } from '../src/model/daily.ts';
import { distanceKm } from '../src/model/geo.ts';
import { freeLooks, toolReading } from '../src/model/observe.ts';
import { CountryRelief, PatchRelief, int16FromBuffer } from '../src/model/relief.ts';
import { solve } from '../src/model/solver.ts';

const relief = new CountryRelief(int16FromBuffer(readFileSync('public/terrain/israel.bin')));
const verified: string[] = [];
const report: Record<string, number | null> = {};
for (const p of PLACES) {
  const patch = new PatchRelief(int16FromBuffer(readFileSync(`public/terrain/places/${p.id}.bin`)), p.lat, p.lon);
  // The daily case is case 0, so the rain gauge seed is `case0:<slot>`: a place must solve from every slot it can land in.
  let km: number | null = 0;
  for (let slot = 0; slot < 5 && km !== null; slot++) {
    const obs = [...freeLooks(p)];
    for (const t of DAILY_CLUES) obs.push(...toolReading(p, t, { elevM: patch.centre(), seed: `case0:${slot}` }));
    const s = solve(relief, obs);
    km = s.pin ? Math.max(km, distanceKm(s.pin.lat, s.pin.lon, p.lat, p.lon)) : null;
  }
  report[p.id] = km === null ? null : +km.toFixed(1);
  if (km !== null && km <= DAILY_STAR_KM[0]) verified.push(p.id);
}
writeFileSync('src/data/daily-pool.json', JSON.stringify({ clues: DAILY_CLUES, starKm: DAILY_STAR_KM, verified, solverKm: report }, null, 1));
console.log(`${verified.length}/${PLACES.length} verified`);
for (const [id, km] of Object.entries(report)) if (km === null || km > DAILY_STAR_KM[0]) console.log('  not in pool:', id, km);
