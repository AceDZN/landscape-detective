import { readFileSync, existsSync } from 'node:fs';
import { PLACES } from './src/data/places';
import { freeLooks, toolReading, type Observation } from './src/model/observe';
import { solve } from './src/model/solver';
import { distanceKm } from './src/model/geo';
import { CountryRelief, PatchRelief, int16FromBuffer } from './src/model/relief';
import type { ToolId } from './src/model/types';
const relief = new CountryRelief(int16FromBuffer(readFileSync('public/terrain/israel.bin')));
const elevOf = (p: any) => { const f = `public/terrain/places/${p.id}.bin`; return existsSync(f) ? new PatchRelief(int16FromBuffer(readFileSync(f)), p.lat, p.lon).centre() : relief.at(p.lat, p.lon); };
// args: id:tool,tool[:night] ...
for (const arg of process.argv.slice(2)) {
  const [id, toolsS = '', night] = arg.split(':');
  const p = PLACES.find((x) => x.id === id)!;
  const tools = (toolsS ? toolsS.split(',') : []) as ToolId[];
  const obs: Observation[] = [...freeLooks(p, night === 'n')];
  for (const t of tools) obs.push(...toolReading(p, t, { elevM: elevOf(p), seed: 'probe' }));
  const s = solve(relief, obs);
  const km = s.pin ? distanceKm(s.pin.lat, s.pin.lon, p.lat, p.lon) : NaN;
  console.log(`${id.padEnd(24)} [${tools.join(',')}]${night ? ' night' : ''}  km=${km.toFixed(1)} feasible=${s.feasible.length} pin=${s.pin ? s.pin.lat.toFixed(2) + ',' + s.pin.lon.toFixed(2) : '-'}`);
}
