import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates, searchTemplates } from '../src/data/templates';
import { readFileSync } from 'node:fs';
test('search finds templates by intent and filters by category', () => {
  assert.ok(searchTemplates('TOUCH').some(t => t.id === 'sprint'));
  assert.equal(searchTemplates('Coins', 'Economy').length, 3);
  assert.equal(searchTemplates('zzzz').length, 0);
});
test('standalone Luau sources match the in-app library', () => {
  // Both LF and CRLF are valid Luau source on Windows; compare code, not editor conventions.
  for (const t of templates) assert.equal(readFileSync(`templates/${t.id}.luau`, 'utf8').replace(/\r\n/g, '\n'), t.code);
});
