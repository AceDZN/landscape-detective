// The daily case draws 5 postcards from a pool of ≥ 30 solver-verified places.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import pool from '../src/data/daily-pool.json' with { type: 'json' };
import { dailyCase, DAILY_CLUES, DAILY_STAR_KM } from '../src/model/daily.ts';
import { distanceKm } from '../src/model/geo.ts';
import { solve } from '../src/model/solver.ts';
import { PLACES, intendedObs, place, relief } from './helpers.ts';

test('daily pool has at least 30 verified places that all exist', () => {
  assert.ok(pool.verified.length >= 30, `${pool.verified.length} verified`);
  for (const id of pool.verified) assert.ok(PLACES.some((p) => p.id === id), id);
});

test('daily cases are deterministic per date, use 5 distinct pool places and fit the charges', () => {
  const a = dailyCase('2026-10-31'), b = dailyCase('2026-10-31'), c = dailyCase('2026-11-01');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.postcards.map((p) => p.placeId), c.postcards.map((p) => p.placeId));
  assert.equal(new Set(a.postcards.map((p) => p.placeId)).size, 5);
  assert.ok(a.intended.flat().length <= a.charges);
});

test('every daily postcard is solvable inside the 3-star radius (re-checked live)', () => {
  for (const key of ['2026-10-31', '2026-11-01', '2026-11-02']) {
    const d = dailyCase(key);
    d.postcards.forEach((pc, i) => {
      const s = solve(relief, intendedObs(d, i, DAILY_CLUES));
      const p = place(pc.placeId);
      const km = distanceKm(s.pin!.lat, s.pin!.lon, p.lat, p.lon);
      assert.ok(km <= DAILY_STAR_KM[0] * 1.5, `${key} ${p.id}: ${km.toFixed(1)} km`);
    });
  }
});
