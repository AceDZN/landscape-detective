// Pure rules: scoring, sun, tool readings, session flow and the wrong-approach consequences.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { altimeterReading, freeLooks, rainReading, toolReading } from '../src/model/observe.ts';
import { pointsFor, starsFor, ibexGap } from '../src/model/scoring.ts';
import { CaseSession } from '../src/model/session.ts';
import { sunPosition, sunVector } from '../src/model/sun.ts';
import { solve } from '../src/model/solver.ts';
import { CASES, PLACES, patchOf, place, relief } from './helpers.ts';
import { distanceKm } from '../src/model/geo.ts';

test('score falls off with distance: 0 km = 5000, 3 km > 4500, 40 km < 1700', () => {
  assert.equal(pointsFor(0), 5000);
  assert.ok(pointsFor(3) > 4500);
  assert.ok(pointsFor(40) < 1700 && pointsFor(40) > 1400);
  assert.ok(pointsFor(200) < 50);
  assert.equal(starsFor(2, [5, 15, 40]), 3);
  assert.equal(starsFor(20, [5, 15, 40]), 1);
  assert.equal(ibexGap(100, [5, 15, 40]), 3);
});

test('the sun sets in the west (a free clue that points to the sea)', () => {
  const s = sunPosition(31.6, 'autumn', 17.3);
  assert.ok(s.azimuth > 240 && s.azimuth < 285, `azimuth ${s.azimuth}`);
  assert.ok(s.elevation < 8);
  const v = sunVector(31.6, 'autumn', 17.3);
  assert.ok(v[0] < -0.9, 'sun vector points west (−x)');
  const noon = sunPosition(31.6, 'summer', 12);
  assert.ok(noon.elevation > 75 && noon.elevation < 85);
});

test('tool readings use Workbook values: altimeter rounds to 50 m, rain within ±20 %', () => {
  assert.equal(altimeterReading(-418), -400);
  assert.equal(altimeterReading(776), 800);
  for (const p of PLACES) {
    const r = rainReading(p, 'x');
    assert.ok(r >= p.rainMm * 0.79 - 10 && r <= p.rainMm * 1.21 + 10, `${p.id} rain reading ${r}`);
    assert.deepEqual(toolReading(p, 'hammer', { elevM: 0, seed: 's' }), [{ kind: 'rock', rock: p.rock }]);
  }
});

test('night postcards only let you hear the sea', () => {
  const coastal = PLACES.find((p) => p.landforms.includes('sea_west'))!;
  assert.deepEqual(freeLooks(coastal, true), [{ kind: 'landform', landform: 'sea_west' }]);
  const inland = PLACES.find((p) => !p.landforms.includes('sea_west'))!;
  assert.deepEqual(freeLooks(inland, true), []);
});

test('charges are scarce: a used tool cannot repeat on the same postcard and charges run out', () => {
  const c = CASES.find((x) => x.charges <= 3)!;
  const s = new CaseSession(c, PLACES);
  const pl = s.place;
  assert.ok(s.useTool('hammer', patchOf(pl).centre()));
  assert.equal(s.useTool('hammer', 0), null, 'same tool twice');
  while (s.charges > 0) {
    const t = (['guide', 'altimeter', 'rain', 'kite'] as const).find((x) => s.canUse(x).ok)!;
    s.useTool(t, 0);
  }
  assert.equal(s.canUse('rain').ok, false);
});

test('free looks only accept what is really there', () => {
  const s = new CaseSession(CASES[0], PLACES);
  assert.equal(s.look({ kind: 'landform', landform: 'makhtesh' }), false);
  const real = freeLooks(s.place)[0];
  assert.equal(s.look(real), true);
  assert.equal(s.look(real), false, 'no duplicates');
});

test('wrong approach: pinning the Golan postcard in the Galilee misses by tens of km and loses the stars', () => {
  const c = CASES.find((x) => x.id === 4)!;
  const golan = place(c.postcards[0].placeId);
  assert.equal(golan.rock, 'basalt');
  const s = new CaseSession(c, PLACES);
  s.openMap();
  s.setPin(32.99, 35.4); // Meron, Upper Galilee (limestone)
  const r = s.commitPin()!;
  assert.ok(r.km > 25, `miss ${r.km.toFixed(1)} km`);
  assert.ok(r.points < 2600);
  assert.ok(r.gap >= 2, 'the ibex escapes');
  s.next();
  assert.ok(s.result(relief).stars <= 1);
  assert.ok(c.trapHe && c.trapHe.length > 5, 'the reveal explains the trap');
});

test('wrong approach: reading the Golan basalt as limestone points the solver at the Galilee instead', () => {
  const c = CASES.find((x) => x.id === 4)!;
  const golan = place(c.postcards[0].placeId);
  const elevM = patchOf(golan).centre();
  const wrong = solve(relief, [{ kind: 'rock', rock: 'limestone' }, { kind: 'alt', m: altimeterReading(elevM) }]);
  const right = solve(relief, [{ kind: 'rock', rock: 'basalt' }, { kind: 'alt', m: altimeterReading(elevM) }]);
  const dw = distanceKm(wrong.pin!.lat, wrong.pin!.lon, golan.lat, golan.lon);
  const dr = distanceKm(right.pin!.lat, right.pin!.lon, golan.lat, golan.lon);
  assert.ok(dw > dr + 15, `limestone reading ${dw.toFixed(1)} km vs basalt ${dr.toFixed(1)} km`);
});

test('hints cost a star and point at an unused intended clue, never a region', () => {
  const c = CASES.find((x) => x.hints && x.intended[0].length > 0)!;
  const s = new CaseSession(c, PLACES);
  const q = s.hint()!;
  assert.ok(q && q.includes('מחברת השדה'));
  for (const p of PLACES) assert.ok(!q.includes(p.nameHe), 'hint never names a place');
  s.openMap();
  const p = s.place;
  s.setPin(p.lat, p.lon);
  s.commitPin();
  while (s.phase !== 'done') {
    s.next();
    if (s.phase === 'explore') {
      s.openMap();
      s.setPin(s.place.lat, s.place.lon);
      s.commitPin();
    }
  }
  assert.equal(s.result(relief).stars, 2);
  assert.ok(s.events.some((e) => e.action === 'hint'));
  assert.ok(s.events.filter((e) => e.action === 'pin').every((e) => e.hinted === true || e.postcard > 0));
});

test('the final case allows no hints', () => {
  const s = new CaseSession(CASES[17], PLACES);
  assert.equal(s.hint(), null);
});
