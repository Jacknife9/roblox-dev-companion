function finite(n: number, label: string, min: number, max: number) {
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
}
export function robuxProceeds(price: number, creatorPercent = 70) {
  finite(price, 'Price', 1, 1_000_000_000); if (!Number.isInteger(price)) throw new Error('Price must be a whole number of Robux.');
  finite(creatorPercent, 'Creator share', 0, 100);
  const kept = Math.floor(price * creatorPercent / 100);
  return { kept, deducted: price - kept };
}
export function priceLadder(base: number, count: number, spacing: number, existing: number[]) {
  finite(base, 'First tier', 1, 1_000_000); finite(count, 'Tier count', 2, 12); finite(spacing, 'Spacing', 1.25, 5);
  if (!Number.isInteger(base) || !Number.isInteger(count)) throw new Error('First tier and tier count must be whole numbers.');
  if (existing.length > 50 || existing.some(n => !Number.isInteger(n) || n < 1 || n > 1_000_000_000)) throw new Error('Enter up to 50 existing whole-number prices.');
  const tiers: number[] = [];
  for (let i = 0; i < count; i++) {
    let candidate = Math.round(base * spacing ** i);
    // Keep a 20% relative gap from every existing price and the suggested ladder.
    for (const other of [...existing, ...tiers].sort((a, b) => a - b)) if (Math.abs(candidate - other) / Math.max(candidate, other) < .2) candidate = Math.ceil(other / .8);
    if (candidate > 1_000_000_000) throw new Error('Suggested ladder exceeds the price limit.');
    tiers.push(candidate);
  }
  return tiers;
}
export type Tier = { tier: number; cost: number; income: number; seconds: number; totalSeconds: number; flag: string };
export function tycoonCurve(income: number, costs: number[], incomeGrowth: number, rebirthMultiplier: number, rebirths: number, minSeconds: number, maxSeconds: number): Tier[] {
  finite(income, 'Income per second', .0001, 1e12); finite(incomeGrowth, 'Income growth per upgrade', 1, 100);
  finite(rebirthMultiplier, 'Rebirth multiplier', 1, 100); finite(rebirths, 'Completed rebirths', 0, 20);
  finite(minSeconds, 'Minimum target wait', 0, 86400); finite(maxSeconds, 'Maximum target wait', 1, 31_536_000);
  if (!Number.isInteger(rebirths) || minSeconds >= maxSeconds) throw new Error('Use whole rebirths and a minimum wait below the maximum.');
  if (costs.length < 1 || costs.length > 50 || costs.some(c => !Number.isFinite(c) || c <= 0 || c > 1e15)) throw new Error('Enter 1 to 50 positive upgrade costs, each at most 1e15.');
  let totalSeconds = 0;
  return costs.map((cost, i) => {
    const rate = income * rebirthMultiplier ** rebirths * incomeGrowth ** i;
    const seconds = cost / rate; totalSeconds += seconds;
    if (!Number.isFinite(rate) || rate > Number.MAX_SAFE_INTEGER || !Number.isFinite(totalSeconds) || totalSeconds > Number.MAX_SAFE_INTEGER) throw new Error('This model is too large to calculate reliably. Reduce multipliers or costs.');
    return { tier: i + 1, cost, income: rate, seconds, totalSeconds, flag: seconds < minSeconds ? 'Fast' : seconds > maxSeconds ? 'Grindy' : 'On target' };
  });
}
export function offsetToScale(x: number, y: number, parentWidth: number, parentHeight: number) {
  finite(x, 'X offset', -1e6, 1e6); finite(y, 'Y offset', -1e6, 1e6);
  finite(parentWidth, 'Parent width', 1, 1e6); finite(parentHeight, 'Parent height', 1, 1e6);
  return { x: x / parentWidth, y: y / parentHeight };
}
export const characters = (text: string) => Array.from(text).length;
export function truncate(text: string, count: number) { const a = Array.from(text); return a.length > count ? a.slice(0, Math.max(0, count - 1)).join('') + '…' : text; }
export function listingCheck(title: string, description: string, keywords: string[]) {
  if (title.length > 300 || description.length > 10_000 || keywords.length > 20) throw new Error('Use a title under 300 characters, description under 10,000 and at most 20 keywords.');
  const content = `${title} ${description}`.toLowerCase();
  const words = content.match(/[\p{L}\p{N}]+/gu) ?? [], counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return { titleLength: characters(title), descriptionLength: characters(description), missing: keywords.map(s => s.trim()).filter(Boolean).filter(k => !content.includes(k.toLowerCase())), repeated: [...counts].filter(([w, n]) => w.length >= 4 && n >= 4).map(([w]) => w), phonePreview: truncate(title, 24), desktopPreview: truncate(title, 40) };
}
export function updateLog(version: number, bullets: string, style: 'Fire' | 'Clean') {
  finite(version, 'Update number', 1, 9999); if (!Number.isInteger(version)) throw new Error('Use a whole update number.');
  if (bullets.length > 8000) throw new Error('Use at most 8,000 characters.');
  const lines = bullets.split(/\r?\n/).map(s => s.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean);
  if (!lines.length || lines.length > 30) throw new Error('Enter 1 to 30 update bullet points.');
  return `UPDATE ${version}${style === 'Fire' ? ' 🔥' : ''}\n\n${lines.map(s => `• ${s}`).join('\n')}\n\nThanks for playing!`;
}
// "Name, a, b" lines → rows. Shared by the unit roster and revenue planner.
function parseRows(text: string, max: number, columns: string) {
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!lines.length || lines.length > max) throw new Error(`Enter 1 to ${max} lines.`);
  return lines.map((line, i) => {
    const parts = line.split(',').map(s => s.trim()), [name, a, b] = [parts[0]!, Number(parts[1]), Number(parts[2])];
    if (parts.length !== 3 || !name || name.length > 60 || !Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`Line ${i + 1}: use "${columns}".`);
    return { name, a, b };
  });
}
export type Unit = { name: string; cost: number; income: number; payback: number; flag: string };
export function unitRoster(text: string, minPayback: number, maxPayback: number): Unit[] {
  finite(minPayback, 'Minimum payback', 0, 31_536_000); finite(maxPayback, 'Maximum payback', 1, 31_536_000);
  if (minPayback >= maxPayback) throw new Error('Minimum payback must be below maximum.');
  const rows = parseRows(text, 60, 'Name, cost, income per second').sort((x, y) => x.a - y.a);
  let best = 0;
  return rows.map(({ name, a: cost, b: income }) => {
    if (cost <= 0 || cost > 1e18 || income <= 0 || income > 1e15) throw new Error(`${name}: cost and income must be positive.`);
    const payback = cost / income;
    const flag = income <= best ? 'Weaker than a cheaper unit' : payback < minPayback ? 'Pays back too fast' : payback > maxPayback ? 'Pays back too slow' : 'On target';
    best = Math.max(best, income);
    return { name, cost, income, payback, flag };
  });
}
export type Offer = { name: string; price: number; kept: number; buyersPercent: number; dailyBuys: number; dailyRobux: number };
export function revenuePlan(text: string, dailyPlayers: number, creatorPercent = 70) {
  finite(dailyPlayers, 'Daily players', 1, 1e8); if (!Number.isInteger(dailyPlayers)) throw new Error('Daily players must be a whole number.');
  const offers: Offer[] = parseRows(text, 30, 'Name, price, % of daily players who buy').map(({ name, a: price, b: buyersPercent }) => {
    finite(buyersPercent, `${name} buyers percent`, 0, 100);
    const { kept } = robuxProceeds(price, creatorPercent), dailyBuys = dailyPlayers * buyersPercent / 100;
    return { name, price, kept, buyersPercent, dailyBuys, dailyRobux: dailyBuys * kept };
  });
  const daily = offers.reduce((sum, o) => sum + o.dailyRobux, 0);
  return { offers, daily, monthly: daily * 30 };
}
