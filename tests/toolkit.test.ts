import test from 'node:test';
import assert from 'node:assert/strict';
import { robuxProceeds, priceLadder, tycoonCurve, offsetToScale, listingCheck, updateLog, truncate } from '../src/core/toolkit';
test('Robux share rounds down once and validates whole prices', () => {
  assert.deepEqual(robuxProceeds(99), { kept: 69, deducted: 30 }); assert.equal(robuxProceeds(100, 60).kept, 60);
  assert.throws(() => robuxProceeds(1.5)); assert.throws(() => robuxProceeds(NaN));
});
test('price ladder avoids existing prices and keeps every suggested tier distinct', () => {
  const old = [25, 49, 100], tiers = priceLadder(25, 6, 1.5, old);
  for (let i = 0; i < tiers.length; i++) for (const other of [...old, ...tiers.slice(0, i)]) assert.ok(Math.abs(tiers[i]! - other) / Math.max(tiers[i]!, other) >= .2);
  assert.throws(() => priceLadder(1, 50, 2, []));
});
test('tycoon model spends each upgrade cost and increases income for the following tier', () => {
  const rows = tycoonCurve(10, [100, 200, 400], 2, 2, 1, 3, 8);
  assert.deepEqual(rows.map(r => r.seconds), [5, 5, 5]); assert.deepEqual(rows.map(r => r.totalSeconds), [5, 10, 15]);
  assert.equal(rows[0]?.flag, 'On target'); assert.equal(tycoonCurve(1, [1, 1000], 1, 1, 0, 2, 20)[1]?.flag, 'Grindy');
  assert.throws(() => tycoonCurve(0, [100], 1, 1, 0, 2, 20));
});
test('offset conversion uses parent dimensions and does not silently clamp positions', () => {
  assert.deepEqual(offsetToScale(960, -100, 1920, 1000), { x: .5, y: -.1 }); assert.throws(() => offsetToScale(10, 10, 0, 100));
});
test('listing helper counts emoji as characters and flags missing/repeated terms', () => {
  const r = listingCheck('🎮 Tycoon', 'build build build build', ['tycoon', 'pets']); assert.equal(r.titleLength, 8); assert.deepEqual(r.missing, ['pets']); assert.deepEqual(r.repeated, ['build']);
  assert.equal(truncate('abc🎮def', 5), 'abc🎮…');
});
test('update logs normalize bullets and reject empty or oversized input', () => {
  assert.match(updateLog(3, '- New map\n* Fixed lobby', 'Fire'), /^UPDATE 3 🔥\n\n• New map\n• Fixed lobby/);
  assert.throws(() => updateLog(0, 'x', 'Clean')); assert.throws(() => updateLog(3, ' \n ', 'Fire'));
});
