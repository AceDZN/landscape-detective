import { readFileSync } from 'node:fs';
import { rockAt, beltAt, rainAt, landformsAt, climateOf, vegetationOf } from './src/model/world';
import { CountryRelief, int16FromBuffer } from './src/model/relief';
const rel = new CountryRelief(int16FromBuffer(readFileSync('public/terrain/israel.bin')));
const C: [string, number, number][] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const [id, lat, lon] of C) {
  const mm = rainAt(lat, lon), rock = rockAt(lat, lon), el = rel.at(lat, lon), lf = landformsAt(lat, lon);
  console.log(id.padEnd(22), String(Math.round(el)).padStart(6), rock.padEnd(10), String(beltAt(lat, lon)).padEnd(13), String(Math.round(mm)).padStart(4), climateOf(mm).padEnd(13), vegetationOf(mm, rock, el, lf).padEnd(7), lf.join(','));
}
