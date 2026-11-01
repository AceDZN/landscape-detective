import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/data/cases.ts';
import { parseLevelParam } from '../src/host.ts';

test('?level=N opens authored case N (1-based); anything else is ignored', () => {
  const n = CASES.length;
  assert.equal(n, 18);
  assert.equal(parseLevelParam('?level=1', n), 0);
  assert.equal(parseLevelParam('?level=18', n), 17);
  assert.equal(CASES[parseLevelParam('?level=11', n)!].id, 11);
  for (const bad of ['', '?level=0', '?level=19', '?level=-2', '?level=2.5', '?level=abc', '?stage=3']) assert.equal(parseLevelParam(bad, n), null, bad);
});
