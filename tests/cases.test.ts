// Every authored case is solvable from its intended clues, and constant or random
// pinning strategies can't reach two stars.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { distanceKm, mulberry32 } from '../src/model/geo.ts';
import { solve } from '../src/model/solver.ts';
import { starsFor } from '../src/model/scoring.ts';
import { CaseSession, watershedLon } from '../src/model/session.ts';
import { CASES, PLACES, intendedObs, patchOf, place, relief } from './helpers.ts';

test('there are 18 cases in 4 worlds with transfer cases', () => {
  assert.equal(CASES.length, 18);
  assert.deepEqual(CASES.map((c) => c.id), Array.from({ length: 18 }, (_, i) => i + 1));
  for (const w of [1, 2, 3, 4]) assert.ok(CASES.some((c) => c.world === w && (c.transfer || c.id === 18)), `world ${w} has a transfer case`);
  const last = CASES[17];
  assert.equal(last.hints, false, 'final case has no hints');
  assert.ok(last.postcards.length >= 5);
});

test('every postcard refers to a known place and intended tools fit the charges', () => {
  for (const c of CASES) {
    assert.equal(c.intended.length, c.postcards.length, `case ${c.id} intended per postcard`);
    const total = c.intended.reduce((a, t) => a + t.length, 0);
    assert.ok(total <= c.charges, `case ${c.id}: intended ${total} tools > ${c.charges} charges`);
    for (const pc of c.postcards) assert.ok(PLACES.some((p) => p.id === pc.placeId), `case ${c.id}: ${pc.placeId}`);
    assert.ok(c.starKm[0] < c.starKm[1] && c.starKm[1] < c.starKm[2], `case ${c.id} star radii ascend`);
  }
});

const solved = new Map<string, { pin: { lat: number; lon: number }; km: number; feasible: number }>();
function solveCard(caseId: number, i: number) {
  const key = `${caseId}:${i}`;
  const hit = solved.get(key);
  if (hit) return hit;
  const def = CASES.find((c) => c.id === caseId)!;
  const pl = place(def.postcards[i].placeId);
  const s = solve(relief, intendedObs(def, i));
  assert.ok(s.pin, `case ${caseId} postcard ${i} (${pl.id}): no cell fits the intended clues`);
  const r = { pin: s.pin!, km: distanceKm(s.pin!.lat, s.pin!.lon, pl.lat, pl.lon), feasible: s.feasible.length };
  solved.set(key, r);
  return r;
}

for (const c of CASES) {
  test(`case ${c.id} (${c.titleHe}): intended clues → 3 stars`, () => {
    const kms = c.postcards.map((_, i) => solveCard(c.id, i).km);
    const avg = kms.reduce((a, b) => a + b, 0) / kms.length;
    assert.equal(starsFor(avg, c.starKm), 3, `case ${c.id}: solver avg ${avg.toFixed(1)} km (${kms.map((k) => k.toFixed(1)).join(', ')}) vs 3★ ${c.starKm[0]} km`);
  });

  test(`case ${c.id}: constant and random pins don't reach 2 stars`, () => {
    const constants = {
      Jerusalem: { lat: 31.778, lon: 35.235 },
      'centre of Israel': { lat: 31.45, lon: 34.95 },
      'Tel Aviv': { lat: 32.08, lon: 34.78 },
      "Be'er Sheva": { lat: 31.25, lon: 34.79 },
    };
    for (const [name, pin] of Object.entries(constants)) {
      const avg = c.postcards.reduce((a, pc) => a + distanceKm(pin.lat, pin.lon, place(pc.placeId).lat, place(pc.placeId).lon), 0) / c.postcards.length;
      assert.ok(starsFor(avg, c.starKm) < 2, `case ${c.id}: always pinning ${name} averages ${avg.toFixed(1)} km → ≥2 stars`);
    }
    // Random pins on land cells: 2+ stars must be rare.
    const rnd = mulberry32(c.id * 977);
    let wins = 0;
    const N = 400;
    for (let k = 0; k < N; k++) {
      const avg =
        c.postcards.reduce((a, pc) => {
          const lat = 29.6 + rnd() * 3.7, lon = 34.3 + rnd() * 1.5;
          const p = place(pc.placeId);
          return a + distanceKm(lat, lon, p.lat, p.lon);
        }, 0) / c.postcards.length;
      if (starsFor(avg, c.starKm) >= 2) wins++;
    }
    assert.ok(wins / N < 0.1, `case ${c.id}: random guessing reaches 2★ ${((wins / N) * 100).toFixed(1)}% of the time`);
  });
}

test('playing every case through the session with the solver pins earns 3 stars and keeps the rules', () => {
  for (const c of CASES) {
    const s = new CaseSession(c, PLACES);
    c.postcards.forEach((pc, i) => {
      const pl = place(pc.placeId);
      for (const t of c.intended[i]) assert.ok(s.useTool(t, patchOf(pl).centre()), `case ${c.id}: tool ${t}`);
      s.openMap();
      const pin = solveCard(c.id, i).pin;
      s.setPin(pin.lat, pin.lon);
      assert.ok(s.commitPin());
      s.next();
    });
    assert.equal(s.phase, 'done');
    const r = s.result(relief);
    assert.equal(r.ruleOk, true, `case ${c.id}: rule broken by solver pins`);
    assert.equal(r.stars, 3, `case ${c.id}: ${r.stars} stars, avg ${r.avgKm.toFixed(1)} km`);
  }
});

test('case 5: pins in the wrong west→east order cap the case at one star', () => {
  const c = CASES.find((x) => x.rule === 'order_west_east')!;
  assert.ok(c, 'a case with the order rule');
  const s = new CaseSession(c, PLACES);
  const truths = c.postcards.map((pc) => place(pc.placeId));
  // Pin each card exactly on another card's spot, reversed.
  c.postcards.forEach((_, i) => {
    s.openMap();
    const t = truths[c.postcards.length - 1 - i];
    s.setPin(t.lat, t.lon);
    s.commitPin();
    s.next();
  });
  const r = s.result(relief);
  assert.equal(r.ruleOk, false);
  assert.ok(r.stars <= 1);
});

test('case 10: rain-shadow cards are east of the watershed and their twin is west', () => {
  const c = CASES.find((x) => x.rule === 'rain_shadow')!;
  assert.ok(c, 'a case with the rain-shadow rule');
  const sides = c.postcards.map((pc) => {
    const p = place(pc.placeId);
    return p.lon > watershedLon(relief, p.lat) ? 'east' : 'west';
  });
  assert.ok(sides.includes('east') && sides.includes('west'), `sides: ${sides.join(',')}`);
  for (const pc of c.postcards) {
    const p = place(pc.placeId);
    if (p.lon > watershedLon(relief, p.lat)) assert.ok(p.rainMm < 200, `${p.id} east of the ridge should be dry`);
  }
});
