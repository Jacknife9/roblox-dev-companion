import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateIdea, GENRES, SCOPES } from '../src/core/ideas';

test('idea honors requested genre, team and scope with actionable tasks', () => {
  const idea = generateIdea('Obby', 'Solo', 'Weekend', 42);
  assert.equal(idea.genre, 'Obby');
  assert.equal(idea.scope, 'Weekend');
  assert.equal(idea.team, 'Solo');
  assert.equal(idea.tasks.length, 4);
  assert.match(idea.scopeNote, /one/i);
  assert.ok(idea.loop.length > 20);
});
test('same seed is reproducible while different seeds produce variety', () => {
  assert.deepEqual(generateIdea('Tycoon', 'Solo', 'Two weeks', 7), generateIdea('Tycoon', 'Solo', 'Two weeks', 7));
  const titles = new Set(Array.from({ length: 20 }, (_, n) => generateIdea('Tycoon', 'Solo', 'Two weeks', n).title));
  assert.ok(titles.size >= 10);
});
test('all genres and scopes have a complete idea and bounded tasks', () => {
  for (const genre of GENRES) for (const scope of SCOPES) {
    const i = generateIdea(genre, 'Small team', scope, 12);
    assert.ok(i.title && i.hook && i.progression && i.scopeNote);
    assert.ok(i.tasks.every(t => t.length > 5 && t.length <= 200));
  }
});
