import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXACT_DRAW_LIMIT,
  MAX_DRAWS,
  RATE_TOTAL,
  drawGacha,
  parseDrawCount,
  parseRate,
  validateRates,
} from './gacha.ts';

test('draw count accepts normalized 64-bit values and rejects invalid input', () => {
  assert.equal(parseDrawCount('９，２２３，３７２，０３６，８５４，７７５，８０７'), MAX_DRAWS);
  assert.throws(() => parseDrawCount('0'));
  assert.throws(() => parseDrawCount('1.5'));
  assert.throws(() => parseDrawCount((MAX_DRAWS + 1n).toString()));
});

test('rates preserve six decimal places and enforce the total', () => {
  assert.equal(parseRate('3.123456'), 3_123_456n);
  assert.throws(() => parseRate('3.1234567'));
  assert.throws(() => validateRates(parseRate('82.000001'), parseRate('18')));
});

test('exact simulation respects deterministic boundaries', () => {
  const result = drawGacha(3n, { star2: 18_000_000n, star3: 3_000_000n }, (() => {
    const rolls = [0.01, 0.1, 0.9];
    return () => rolls.shift() ?? 0.9;
  })());
  assert.deepEqual(result, { star1: 1n, star2: 1n, star3: 1n });
});

test('zero and full-rate boundaries are exact', () => {
  assert.deepEqual(drawGacha(10n, { star2: 0n, star3: 0n }), { star1: 10n, star2: 0n, star3: 0n });
  assert.deepEqual(drawGacha(10n, { star2: 0n, star3: RATE_TOTAL }), { star1: 0n, star2: 0n, star3: 10n });
});

test('approximation supports the signed 64-bit maximum and preserves totals', () => {
  const result = drawGacha(MAX_DRAWS, { star2: 18_000_000n, star3: 3_000_000n }, () => 0.5);
  assert.ok(result.star1 >= 0n && result.star2 >= 0n && result.star3 >= 0n);
  assert.equal(result.star1 + result.star2 + result.star3, MAX_DRAWS);
});

test('threshold and threshold plus one both preserve totals', () => {
  for (const count of [EXACT_DRAW_LIMIT, EXACT_DRAW_LIMIT + 1n]) {
    const result = drawGacha(count, { star2: 18_000_000n, star3: 3_000_000n }, () => 0.5);
    assert.equal(result.star1 + result.star2 + result.star3, count);
  }
});
