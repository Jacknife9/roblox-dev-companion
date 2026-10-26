import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { parseDevExDocument, normalizeStats, parseGameReference, validateDevExRate, validateStatsResult, DEVEX_PAGE } from '../src/core/robloxData';
import { createRobloxData } from '../server/roblox';
test('DevEx parser reads changing rates from the official document and fails closed', () => {
  const page = 'standard exchange rate for the DevEx program is `0.0041` per 1 Earned Robux';
  assert.equal(parseDevExDocument(page).standard, .0041); assert.equal(parseDevExDocument(page.replace('0.0041', '0.0062')).standard, .0062);
  assert.throws(() => parseDevExDocument('old rate was .0035, new rate unknown')); assert.throws(() => parseDevExDocument('standard exchange rate for the DevEx program is 9 per 1 Earned Robux'));
});
test('unverified rates fail closed; failed refreshes explicitly identify a last verified cached rate', async () => {
  const db = new DatabaseSync(':memory:'); let now = Date.now(), available = true;
  const fetcher = async () => { if (!available) throw new Error('network'); return new Response('standard exchange rate for the DevEx program is `0.0048` per 1 Earned Robux'); };
  try {
    const service = createRobloxData(db, fetcher as typeof fetch, () => now);
    const fresh = await service.devex(); assert.equal(fresh.stale, false);
    available = false; now += 3600_001;
    const stale = await service.devex(); assert.equal(stale.stale, true); assert.equal(stale.fetchedAt, fresh.fetchedAt);
    await assert.rejects(createRobloxData(db, fetcher as typeof fetch).devex(), /Could not verify/);
  } finally { db.close(); }
});
test('client boundaries reject malformed rates and mixed-game history', () => {
  const validRate = { standard: .0044, eligibleUS18: null, legacy: null, stale: false, source: DEVEX_PAGE, fetchedAt: new Date().toISOString() };
  assert.equal(validateDevExRate(validRate).standard, .0044); assert.throws(() => validateDevExRate({ ...validRate, eligibleUS18: 'bad' }));
  const snapshot = normalizeStats(1, { id: 1, name: 'Game', visits: 0, playing: 0, favoritedCount: 0 }, { id: 1, upVotes: 0, downVotes: 0 }, new Date().toISOString());
  assert.throws(() => validateStatsResult({ current: snapshot, history: [{ ...snapshot, universeId: 2 }], historyNote: '' }));
});
test('game references accept IDs and genuine game links, rejecting URLs as proxy targets', () => {
  assert.deepEqual(parseGameReference('https://www.roblox.com/games/920587237/Adopt-Me', 'Universe ID'), { id: 920587237, kind: 'placeId' });
  assert.deepEqual(parseGameReference('383310974', 'Universe ID'), { id: 383310974, kind: 'universeId' });
  assert.throws(() => parseGameReference('https://evil.example/games/1', 'Place ID')); assert.throws(() => parseGameReference('0', 'Place ID'));
});
test('stats normalize counts and represent zero votes without a fake ratio', () => {
  const result = normalizeStats(1, { id: 1, name: 'Build', visits: 100, playing: 2, favoritedCount: 4 }, { id: 1, upVotes: 0, downVotes: 0 }, new Date().toISOString());
  assert.equal(result.likeRatio, null); assert.throws(() => normalizeStats(1, { id: 2 }, {}, 'now'));
});
test('public service fetches official sources, caches live data and records real snapshots only', async () => {
  const db = new DatabaseSync(':memory:'); const calls: string[] = [];
  const fetcher = async (url: string | URL | Request) => {
    const u = String(url); calls.push(u);
    if (u.endsWith('.md')) return new Response('standard exchange rate for the DevEx program is `0.0042` per 1 Earned Robux');
    if (u.includes('/votes?')) return Response.json({ data: [{ id: 1, upVotes: 9, downVotes: 1 }] });
    return Response.json({ data: [{ id: 1, name: 'Test', visits: 100, playing: 2, favoritedCount: 3 }] });
  };
  try {
    const service = createRobloxData(db, fetcher as typeof fetch);
    assert.equal((await service.devex()).standard, .0042); await service.devex(); assert.equal(calls.length, 1);
    const first = await service.getStats(new URLSearchParams({ universeId: '1' })); assert.equal(first.current.likeRatio, .9); assert.equal(first.history.length, 1);
    await service.getStats(new URLSearchParams({ universeId: '1' })); assert.equal(calls.length, 3);
    assert.ok(calls.every(u => /^https:\/\/(create|games)\.roblox\.com\//.test(u)));
    await assert.rejects(service.getStats(new URLSearchParams({ universeId: 'https://localhost' })));
  } finally { db.close(); }
});
