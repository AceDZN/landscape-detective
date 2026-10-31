import { readFileSync, writeFileSync } from 'node:fs';
import { rockAt, beltAt, rainAt, landformsAt, climateOf, vegetationOf } from './src/model/world';
import { RAIN_STATIONS } from './src/data/zones';
import { distanceKm } from './src/model/geo';
import { CountryRelief, int16FromBuffer } from './src/model/relief';
import { AUTH } from './.zz-authored';
const rel = new CountryRelief(int16FromBuffer(readFileSync('public/terrain/israel.bin')));
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const f5 = (x: number) => x.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
const out: string[] = [];
const report: string[] = [];
for (const a of AUTH) {
  const rock = rockAt(a.lat, a.lon), belt = beltAt(a.lat, a.lon), mm = rainAt(a.lat, a.lon);
  const rainMm = Math.round(mm / 10) * 10;
  const el = rel.at(a.lat, a.lon);
  const lfs = landformsAt(a.lat, a.lon).filter((l) => !(a.dropLandforms ?? []).includes(l));
  const veg = vegetationOf(rainMm, rock, el, lfs);
  const near = RAIN_STATIONS.map((s) => ({ s, d: distanceKm(a.lat, a.lon, s.lat, s.lon) })).sort((x, y) => x.d - y.d).slice(0, 2);
  const rainSrc = `IMS 1991–2020 normals (season summary 2021/22): ${near.map((n) => `${n.s.nameHe} ${n.s.mm} mm (${n.d.toFixed(0)} km)`).join(', ')}; IDW of the 6 nearest stations = ${Math.round(mm)} mm`;
  const sources = [rainSrc, ...a.sources, 'Coordinates checked against the bundled SRTM relief (public/terrain/israel.bin) and the zone polygons in src/data/zones.ts'];
  report.push(`${a.id.padEnd(24)} ${String(Math.round(el)).padStart(5)} ${rock.padEnd(9)} ${String(belt).padEnd(13)} ${rainMm} ${climateOf(rainMm)} ${veg} [${lfs.join(',')}]`);
  out.push(`  {
    id: ${q(a.id)},
    nameHe: ${q(a.nameHe)},
    lat: ${f5(a.lat)},
    lon: ${f5(a.lon)},
    rock: ${q(rock)},
    vegetation: ${q(veg)},
    rainMm: ${rainMm},
    climate: ${q(climateOf(rainMm))},
    belt: ${q(String(belt))},
    landforms: [${lfs.map(q).join(', ')}],
    culture: [${a.culture.map(q).join(', ')}],${a.waterLevelM !== undefined ? `\n    waterLevelM: ${a.waterLevelM},` : ''}
    startHeadingDeg: ${a.heading},
    revealHe: ${q(a.revealHe)},
    modules: [${a.modules.map(q).join(', ')}],
    sources: [
${sources.map((s) => `      ${q(s)},`).join('\n')}
    ],
  },`);
}
const header = `// Real places: every postcard of the 18 cases plus the daily-case pool.
// Coordinates are spots actually on that landscape (checked against the bundled SRTM
// relief). rock / belt / rainMm / landforms / vegetation are kept in agreement with the
// zone model (src/data/zones.ts + src/model/world.ts); rainMm is the IDW of real IMS
// 1991–2020 station normals, rounded to 10 mm. Elevation is not stored: it comes from
// the relief. Culture lists buildings and signs only, never people.
import type { Place } from '../model/types';

export const PLACES: Place[] = [
`;
writeFileSync('src/data/places.ts', header + out.join('\n') + '\n];\n');
console.log(report.join('\n'));
