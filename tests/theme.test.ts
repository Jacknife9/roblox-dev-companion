import test from 'node:test';
import assert from 'node:assert/strict';
import { palettes, parseTheme } from '../src/theme/palette';
test('theme preference accepts only known modes', () => {
  assert.equal(parseTheme('dark'), 'dark'); assert.equal(parseTheme('light'), 'light');
  assert.equal(parseTheme(null), null); assert.equal(parseTheme('broken'), null);
});
function luminance(hex: string) {
  const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
  return v[0]! * .2126 + v[1]! * .7152 + v[2]! * .0722;
}
test('both themes keep readable text and action contrast', () => {
  for (const p of Object.values(palettes)) for (const [fg, bg] of [[p.ink, p.paper], [p.muted, p.surface], [p.onPrimary, p.green], [p.onSelected, p.ink], [p.error, p.errorBg]]) {
    const a = luminance(fg!), b = luminance(bg!);
    assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${fg} / ${bg}`);
  }
});
