// Every place's recorded rock / belt / rain / climate / landforms / altitude agree
// with the zone model and the bundled SRTM relief.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import meta from '../src/data/relief-meta.json' with { type: 'json' };
import { BELT_ZONES, CITIES, FEATURE_ZONES } from '../src/data/zones.ts';
import { distanceKm } from '../src/model/geo.ts';
import { beltAt, climateOf, rainAt, rockAt, vegetationOf } from '../src/model/world.ts';
import { PLACES, patchOf, relief } from './helpers.ts';

test('at least 30 distinct verified places', () => {
  assert.ok(PLACES.length >= 30, `${PLACES.length} places`);
  assert.equal(new Set(PLACES.map((p) => p.id)).size, PLACES.length);
  for (const p of PLACES) {
    assert.ok(p.sources.length > 0, `${p.id} has sources`);
    assert.ok(p.modules.every((m) => m.startsWith('/geography/grade-')), `${p.id} module paths`);
    assert.ok(p.revealHe.length > 5, `${p.id} reveal line`);
  }
});

for (const p of PLACES) {
  test(`${p.id}: zone model agrees with the recorded values`, () => {
    assert.equal(rockAt(p.lat, p.lon), p.rock, `${p.id} rock`);
    assert.equal(beltAt(p.lat, p.lon), p.belt, `${p.id} belt`);
    const r = rainAt(p.lat, p.lon);
    assert.ok(Math.abs(r - p.rainMm) / p.rainMm <= 0.35, `${p.id} rain model ${r.toFixed(0)} vs recorded ${p.rainMm}`);
    assert.equal(climateOf(p.rainMm), p.climate, `${p.id} climate`);
    for (const lf of p.landforms) {
      if (lf === 'sea_west') continue;
      if (!FEATURE_ZONES.some((z) => z.landform === lf)) continue;
      assert.ok(FEATURE_ZONES.some((z) => z.landform === lf && inside(p, z.poly)), `${p.id}: ${lf} not in a feature zone`);
    }
    if (p.vegetation !== 'oasis') assert.equal(vegetationOf(p.rainMm, p.rock, patchOf(p).centre(), p.landforms), p.vegetation, `${p.id} vegetation rule`);
  });

  test(`${p.id}: altitude from the bundled relief`, () => {
    const m = (meta.places as Record<string, { centerM: number }>)[p.id];
    assert.ok(m, `${p.id} patch built`);
    const centre = patchOf(p).centre();
    assert.ok(Math.abs(centre - m.centerM) < 2);
    // The 500 m country grid agrees with the 20 m patch within local relief.
    assert.ok(Math.abs(relief.at(p.lat, p.lon) - centre) < 160, `${p.id}: country ${relief.at(p.lat, p.lon).toFixed(0)} vs patch ${centre.toFixed(0)}`);
    if (p.waterLevelM !== undefined && p.waterLevelM < -100) assert.ok(centre < 0, `${p.id} below sea level`);
  });
}

function inside(p: { lat: number; lon: number }, poly: [number, number][]) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > p.lat !== yj > p.lat && p.lon < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

test('key facts from the curriculum hold in the bundled relief', () => {
  // Dead Sea shore: far below sea level (SRTM 2000 surface ≈ −415 m; Workbook: more than 430 m below today).
  assert.ok(relief.at(31.5, 35.5) < -400);
  // Kinneret below sea level.
  assert.ok(relief.at(32.82, 35.59) < -200);
  // Jerusalem hills ~ 700–850 m.
  const j = relief.at(31.78, 35.2);
  assert.ok(j > 650 && j < 900, `Jerusalem ${j}`);
  // Rain falls north→south and west→east: Galilee > Be'er Sheva > Eilat; Jerusalem > Dead Sea.
  assert.ok(rainAt(32.99, 35.4) > rainAt(31.25, 34.79));
  assert.ok(rainAt(31.25, 34.79) > rainAt(29.56, 34.95));
  assert.ok(rainAt(31.78, 35.21) > 2 * rainAt(31.5, 35.45), 'rain shadow east of the ridge');
  // Golan rock is basalt, not limestone; the coast near Nitzanim is sand/kurkar; Eilat mountains granite.
  assert.equal(rockAt(33.0, 35.75), 'basalt');
  assert.ok(['sand', 'kurkar'].includes(rockAt(31.75, 34.62)));
  assert.equal(beltAt(32.0, 34.8), 'coastal_plain');
  assert.ok(BELT_ZONES.length >= 5);
  assert.ok(CITIES.filter((c) => c.onMap).length >= 10);
  assert.ok(distanceKm(31.778, 35.235, 32.08, 34.78) > 40);
});
