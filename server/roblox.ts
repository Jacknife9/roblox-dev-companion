import type { DatabaseSync } from 'node:sqlite';
import { DEVEX_PAGE, normalizeStats, parseDevExDocument, type DevExRate, type GameStats } from '../src/core/robloxData';
export class PublicDataError extends Error { constructor(public status: number, message: string) { super(message); } }
type Fetcher = typeof fetch;
export function createRobloxData(db: DatabaseSync, fetcher: Fetcher = fetch, clock = Date.now) {
  db.exec('CREATE TABLE IF NOT EXISTS observations(universe_id INTEGER NOT NULL, observed_at TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(universe_id,observed_at));');
  let rate: DevExRate | null = null, ratePending: Promise<DevExRate> | null = null;
  const pending = new Map<number, Promise<GameStats>>();
  async function read(url: string, text = false) {
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000), redirect: 'error', headers: { Accept: text ? 'text/markdown, text/plain' : 'application/json' } });
    if (!response.ok) throw new Error('Roblox public source unavailable.');
    let length = 0; const parts: Uint8Array[] = [];
    if (!response.body) throw new Error('Empty Roblox response.');
    for await (const chunk of response.body) { length += chunk.byteLength; if (length > 512_000) throw new Error('Roblox response too large.'); parts.push(chunk); }
    const raw = Buffer.concat(parts).toString('utf8'); return text ? raw : JSON.parse(raw);
  }
  async function devex(): Promise<DevExRate> {
    if (rate && clock() - Date.parse(rate.fetchedAt) < 3600_000) return rate;
    if (ratePending) return ratePending;
    ratePending = (async () => {
      try {
        const document = await read(DEVEX_PAGE + '.md', true);
        rate = { ...parseDevExDocument(document), source: DEVEX_PAGE, fetchedAt: new Date(clock()).toISOString(), stale: false }; return rate;
      } catch {
        if (rate) return { ...rate, stale: true };
        throw new PublicDataError(502, 'Could not verify the current DevEx rate from Roblox. Try again later or open the source page. No dollar estimate is available.');
      }
    })().finally(() => { ratePending = null; });
    return ratePending;
  }
  async function stats(id: number): Promise<GameStats> {
    const cached = db.prepare('SELECT data FROM observations WHERE universe_id=? ORDER BY observed_at DESC LIMIT 1').get(id) as { data: string } | undefined;
    if (cached) { const snapshot = JSON.parse(cached.data) as GameStats; if (clock() - Date.parse(snapshot.fetchedAt) < 60_000) return snapshot; }
    if (pending.has(id)) return pending.get(id)!;
    if (pending.size >= 8) throw new PublicDataError(429, 'Stats service is busy. Try again shortly.');
    const job = (async () => {
      try {
        const [games, votes] = await Promise.all([read(`https://games.roblox.com/v1/games?universeIds=${id}`), read(`https://games.roblox.com/v1/games/votes?universeIds=${id}`)]);
        const result = normalizeStats(id, games.data?.[0], votes.data?.[0], new Date(clock()).toISOString());
        db.prepare('INSERT OR IGNORE INTO observations(universe_id,observed_at,data) VALUES(?,?,?)').run(id, result.fetchedAt, JSON.stringify(result));
        db.prepare('DELETE FROM observations WHERE universe_id=? AND observed_at NOT IN (SELECT observed_at FROM observations WHERE universe_id=? ORDER BY observed_at DESC LIMIT 200)').run(id, id);
        db.exec('DELETE FROM observations WHERE universe_id NOT IN (SELECT universe_id FROM observations GROUP BY universe_id ORDER BY MAX(observed_at) DESC LIMIT 1000)');
        return result;
      } catch { throw new PublicDataError(502, 'Public game statistics are unavailable. Check the ID and try later. Private or removed games may not be returned.'); }
    })().finally(() => pending.delete(id));
    pending.set(id, job); return job;
  }
  async function getStats(query: URLSearchParams) {
    const raw = query.get('universeId') ?? query.get('placeId') ?? '';
    const reference = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(reference) || reference < 1) throw new PublicDataError(400, 'Enter a valid universe or place ID.');
    let id = reference;
    if (!query.has('universeId')) {
      try { const resolved = await read(`https://apis.roblox.com/universes/v1/places/${reference}/universe`); id = resolved.universeId;
        if (!Number.isSafeInteger(id) || id < 1) throw new Error('No universe');
      } catch { throw new PublicDataError(502, 'Could not resolve this place to a public game.'); }
    }
    const current = await stats(id);
    const history = db.prepare('SELECT data FROM observations WHERE universe_id=? ORDER BY observed_at ASC').all(id) as { data: string }[];
    return { current, history: history.map(row => JSON.parse(row.data)), sources: ['https://create.roblox.com/docs/cloud/reference/domains/games'], historyNote: 'Observed on refresh on this server. No historical data is backfilled. Up to 200 snapshots per game; refreshes within 60 seconds share a snapshot.' };
  }
  return { devex, getStats };
}
