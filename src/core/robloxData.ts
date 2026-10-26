export const DEVEX_PAGE = 'https://create.roblox.com/docs/production/monetization/developer-exchange';
export type DevExRate = { standard: number; eligibleUS18: number | null; legacy: number | null; fetchedAt: string; source: string; stale: boolean };
export function validateDevExRate(value: unknown): DevExRate {
  const v = value as Partial<DevExRate> | null;
  const rate = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 1;
  if (!v || !rate(v.standard) || (v.eligibleUS18 !== null && !rate(v.eligibleUS18)) || (v.legacy !== null && !rate(v.legacy)) || v.source !== DEVEX_PAGE || typeof v.fetchedAt !== 'string' || !Number.isFinite(Date.parse(v.fetchedAt)) || typeof v.stale !== 'boolean') throw new Error('The service returned an invalid DevEx rate.');
  return v as DevExRate;
}
export function parseDevExDocument(document: string) {
  const text = document.replace(/<[^>]*>/g, ' ').replace(/[`*_]/g, '').replace(/\s+/g, ' ');
  function rate(pattern: RegExp, required = false) {
    const value = Number(text.match(pattern)?.[1]);
    if (!Number.isFinite(value) || value <= 0 || value > 1) { if (required) throw new Error('Roblox’s rate page changed or did not contain a readable standard rate.'); return null; }
    return value;
  }
  return {
    standard: rate(/standard exchange rate for the DevEx program is\s*\$?(0\.\d+)\s*per 1 Earned Robux/i, true)!,
    eligibleUS18: rate(/higher exchange rate of\s*\$?(0\.\d+)\s*for certain Earned Robux/i),
    legacy: rate(/Before September 5, 2025[\s\S]{0,180}?standard exchange rate was\s*\$?(0\.\d+)/i),
  };
}
export type GameStats = { universeId: number; name: string; visits: number; playing: number; favorites: number; upVotes: number; downVotes: number; likeRatio: number | null; fetchedAt: string; updatedAt: string | null };
export function parseGameReference(raw: string, kind: 'Universe ID' | 'Place ID') {
  const text = raw.trim();
  const link = text.match(/^https:\/\/(?:www\.|web\.)?roblox\.com\/games\/(\d+)(?:\/[^?#]*)?(?:[?#].*)?$/i);
  const number = link?.[1] ?? text;
  const id = Number(number);
  if (!/^\d+$/.test(number) || !Number.isSafeInteger(id) || id <= 0) throw new Error('Enter a positive universe/place ID or an https://www.roblox.com/games/… link.');
  return { id, kind: link ? 'placeId' as const : kind === 'Universe ID' ? 'universeId' as const : 'placeId' as const };
}
export function normalizeStats(universeId: number, gameValue: unknown, votesValue: unknown, fetchedAt: string): GameStats {
  if (!gameValue || typeof gameValue !== 'object' || !votesValue || typeof votesValue !== 'object') throw new Error('Roblox did not return this public game.');
  const game = gameValue as Record<string, unknown>, votes = votesValue as Record<string, unknown>;
  function count(value: unknown) { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Roblox returned incomplete statistics.'); return value; }
  if (!game || game.id !== universeId || typeof game.name !== 'string' || game.name.length > 512 || !votes || votes.id !== universeId) throw new Error('Roblox did not return this public game.');
  const upVotes = count(votes.upVotes), downVotes = count(votes.downVotes);
  return { universeId, name: game.name, visits: count(game.visits), playing: count(game.playing), favorites: count(game.favoritedCount), upVotes, downVotes, likeRatio: upVotes + downVotes > 0 ? upVotes / (upVotes + downVotes) : null, fetchedAt, updatedAt: typeof game.updated === 'string' && Number.isFinite(Date.parse(game.updated)) ? game.updated : null };
}
export function validateStatsResult(value: unknown): { current: GameStats; history: GameStats[]; historyNote: string } {
  const root = value as { current?: GameStats; history?: GameStats[]; historyNote?: string } | null;
  function snapshot(v: GameStats | undefined) {
    if (!v || !Number.isSafeInteger(v.universeId) || v.universeId < 1 || typeof v.fetchedAt !== 'string' || !Number.isFinite(Date.parse(v.fetchedAt))) throw new Error('Invalid public stats snapshot.');
    return normalizeStats(v.universeId, { ...v, id: v.universeId, favoritedCount: v.favorites, updated: v.updatedAt }, { id: v.universeId, upVotes: v.upVotes, downVotes: v.downVotes }, v.fetchedAt);
  }
  if (!root || !Array.isArray(root.history) || root.history.length > 200 || typeof root.historyNote !== 'string' || root.historyNote.length > 1000) throw new Error('Invalid stats history.');
  const current = snapshot(root.current), history = root.history.map(snapshot);
  if (history.some(s => s.universeId !== current.universeId)) throw new Error('Stats history contains a different game.');
  return { current, history, historyNote: root.historyNote };
}
