function bounded(value: number, name: string, min: number, max: number, integer = false) {
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new Error(`${name} must be ${integer ? 'a whole number ' : ''}from ${min} to ${max}.`);
  }
}

function safeTotal(value: number) {
  if (!Number.isFinite(value) || value > 1e15) throw new Error('Curve is too large. Reduce the base, growth, or count.');
  return value;
}

export function parseNumber(text: string): number {
  const normalized = text.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) throw new Error('Enter a complete number, such as 100 or 1.25.');
  const value = Number(normalized);
  if (!Number.isFinite(value)) throw new Error('Number is too large.');
  return value;
}

/** Level 1 starts at 0 XP. Each transition is rounded before summing. */
export function xpCurve(base: number, growth: number, targetLevel: number) {
  bounded(base, 'Base XP', 1, 1e9);
  bounded(growth, 'Growth', 1, 3);
  bounded(targetLevel, 'Target level', 2, 200, true);
  let total = 0;
  return Array.from({ length: targetLevel - 1 }, (_, index) => {
    const required = Math.round(base * growth ** index);
    total = safeTotal(total + required);
    return { level: index + 2, required, total };
  });
}

/** Prices round per purchase. Minutes assumes constant income and zero starting balance. */
export function upgradeCurve(base: number, growth: number, count: number, income: number) {
  bounded(base, 'First cost', 1, 1e9);
  bounded(growth, 'Growth', 1, 3);
  bounded(count, 'Purchases', 1, 100, true);
  bounded(income, 'Coins per minute', 0.01, 1e9);
  let total = 0;
  return Array.from({ length: count }, (_, index) => {
    const cost = Math.round(base * growth ** index);
    total = safeTotal(total + cost);
    return { upgrade: index + 1, cost, total, minutes: total / income };
  });
}

export function economyBalance(earnRate: number, spendRate: number, minutes: number) {
  bounded(earnRate, 'Earned per minute', 0, 1e9);
  bounded(spendRate, 'Spent per minute', 0, 1e9);
  bounded(minutes, 'Session minutes', 0.1, 1440);
  const earned = earnRate * minutes;
  const spent = spendRate * minutes;
  return { earned, spent, net: earned - spent, sinkRatio: earned === 0 ? null : spent / earned };
}
