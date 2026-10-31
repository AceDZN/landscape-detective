// Fills LEVELS.md "Verified solution" lines: the intended clues of each postcard run through the
// solver, with the pin it reaches, the miss and the stars. Run: npx tsx scripts/verify-levels.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { CASES, intendedObs, place, relief } from '../tests/helpers.ts';
import { distanceKm } from '../src/model/geo.ts';
import { solve } from '../src/model/solver.ts';
import { starsFor } from '../src/model/scoring.ts';
import { TOOL_HE } from '../src/model/terms.ts';

let md = readFileSync('LEVELS.md', 'utf8');
// Keep the tables' coordinates in step with places.ts (spawns get nudged onto dry shore).
md = md.replace(/\(`([a-z_]+)`\) \| [\d.]+, [\d.]+ \|/g, (m, id: string) => {
  const pl = place(id);
  return `(\`${id}\`) | ${pl.lat}, ${pl.lon} |`;
});
for (const def of CASES) {
  const parts: string[] = [];
  let sum = 0;
  def.postcards.forEach((pc, i) => {
    const pl = place(pc.placeId);
    const sol = solve(relief, intendedObs(def, i));
    const km = sol.pin ? distanceKm(sol.pin.lat, sol.pin.lon, pl.lat, pl.lon) : NaN;
    sum += km;
    const tools = def.intended[i].map((t) => TOOL_HE[t].name).join(' + ') || 'looking only';
    parts.push(`${i + 1}) ${tools} → pin ${sol.pin?.lat.toFixed(3)}, ${sol.pin?.lon.toFixed(3)}, ${km.toFixed(1)} km off`);
  });
  const avg = sum / def.postcards.length;
  const line = `Verified solution (solver, ${new Date().toISOString().slice(0, 10)}): ${parts.join('; ')}. Average ${avg.toFixed(1)} km → ${starsFor(avg, def.starKm)}★.`;
  const head = md.search(new RegExp(`^### ${def.id}\\. `, 'm'));
  if (head < 0) continue;
  const at = md.indexOf('Verified solution', head);
  const end = md.indexOf('\n', at);
  md = md.slice(0, at) + line + md.slice(end);
}
writeFileSync('LEVELS.md', md);
