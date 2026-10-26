import { test } from 'node:test';
import assert from 'node:assert/strict';
import { xpCurve, upgradeCurve, economyBalance, parseNumber } from '../src/core/calculators';

test('XP rounds each level before accumulating and starts at level 2', () => {
  assert.deepEqual(xpCurve(100, 1.5, 4), [
    { level: 2, required: 100, total: 100 },
    { level: 3, required: 150, total: 250 },
    { level: 4, required: 225, total: 475 },
  ]);
});
test('constant XP has no off by one at the target level', () => {
  assert.equal(xpCurve(80, 1, 10).at(-1)?.total, 720);
});
test('upgrades include the first purchase and cumulative earning time', () => {
  const rows = upgradeCurve(50, 2, 3, 25);
  assert.deepEqual(rows.at(-1), { upgrade: 3, cost: 200, total: 350, minutes: 14 });
});
test('fractional upgrade prices round per purchase', () => {
  assert.equal(upgradeCurve(1, 1.5, 3, 1).at(-1)?.total, 5);
});
test('economy applies session duration to both faucets and sinks', () => {
  assert.deepEqual(economyBalance(12, 8, 30), { earned: 360, spent: 240, net: 120, sinkRatio: 2 / 3 });
});
test('zero income gives an undefined sink ratio rather than Infinity', () => {
  assert.equal(economyBalance(0, 5, 10).sinkRatio, null);
});
for (const n of [NaN, Infinity, -1, 0]) {
  test(`XP rejects invalid base ${n}`, () => assert.throws(() => xpCurve(n, 1.1, 10)));
}
test('rejects fractional levels and excessive level count', () => {
  assert.throws(() => xpCurve(100, 1, 2.5));
  assert.throws(() => xpCurve(100, 1, 201));
});
test('rejects explosive curves before showing imprecise output', () => {
  assert.throws(() => xpCurve(1e9, 3, 200), /large/);
});
test('upgrade time rejects zero income and zero purchases', () => {
  assert.throws(() => upgradeCurve(50, 1.1, 10, 0));
  assert.throws(() => upgradeCurve(50, 1.1, 0, 10));
});
test('economy rejects negative spending and zero duration', () => {
  assert.throws(() => economyBalance(1, -1, 30));
  assert.throws(() => economyBalance(1, 1, 0));
});
test('number parser accepts decimal commas and rejects partial or blank inputs', () => {
  assert.equal(parseNumber('1,25'), 1.25);
  assert.equal(parseNumber(' 15 '), 15);
  for (const text of ['', '1x', '1,2,3', 'Infinity', '1e3', '0x10']) assert.throws(() => parseNumber(text));
});
