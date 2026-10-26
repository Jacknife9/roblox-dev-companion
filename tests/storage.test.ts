import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../src/core/projects';
import { emptyWorkspace, parseBackup, serializeBackup, createRepository } from '../src/storage/repository';

test('workspace round trips including completed tasks and Unicode notes', () => {
  const p = createProject('海 Cafe', 'Social', 'Build ☕', ['Serve']);
  p.tasks[0]!.done = true;
  const state = { version: 1 as const, projects: [p] };
  assert.deepEqual(parseBackup(serializeBackup(state)), state);
});
test('rejects corrupt JSON, unknown versions and wrong types', () => {
  for (const raw of ['{', 'null', '{"version":2,"projects":[]}', '{"version":1,"projects":"bad"}']) assert.throws(() => parseBackup(raw));
});
test('rejects duplicate IDs and non-boolean completion values', () => {
  const p = createProject('A', 'Obby', '', ['Run']);
  assert.throws(() => parseBackup(JSON.stringify({ version: 1, projects: [p, p] })), /duplicate/i);
  (p.tasks[0] as unknown as { done: string }).done = 'false';
  assert.throws(() => parseBackup(JSON.stringify({ version: 1, projects: [p] })));
});
test('rejects missing dates, excessive counts, invalid phases, oversized backups', () => {
  const p = createProject('A');
  assert.throws(() => parseBackup(JSON.stringify({ version: 1, projects: [{ ...p, createdAt: '' }] })));
  assert.throws(() => parseBackup(JSON.stringify({ version: 1, projects: [{ ...p, phase: 'fake' }] })));
  assert.throws(() => parseBackup(JSON.stringify({ version: 1, projects: Array(101).fill(p) })));
  assert.throws(() => parseBackup(' '.repeat(1_000_001)), /large/i);
});
test('a new installation is empty and loading does not write', async () => {
  let writes = 0;
  const repo = createRepository({ getItem: async () => null, setItem: async () => { writes++; } });
  assert.deepEqual(await repo.load(), emptyWorkspace());
  assert.equal(writes, 0);
});
test('corrupt stored data stays untouched and is available for recovery', async () => {
  let raw = '{broken';
  const repo = createRepository({ getItem: async () => raw, setItem: async (_, v) => { raw = v; } });
  await assert.rejects(repo.load());
  assert.equal(await repo.readRaw(), '{broken');
});
test('serializes overlapping writes so newest state wins even with a slow first write', async () => {
  let stored = '';
  let unblock!: () => void;
  const gate = new Promise<void>(resolve => { unblock = resolve; });
  let calls = 0;
  const repo = createRepository({ getItem: async () => stored || null, setItem: async (_, raw) => {
    if (++calls === 1) await gate;
    stored = raw;
  } });
  const first = repo.save({ version: 1, projects: [createProject('First')] });
  const second = repo.save({ version: 1, projects: [createProject('Latest')] });
  unblock();
  await Promise.all([first, second]);
  assert.equal((await repo.load()).projects[0]?.title, 'Latest');
});
test('a failed write rejects but does not poison later retries', async () => {
  let stored = '';
  let fail = true;
  const repo = createRepository({ getItem: async () => stored || null, setItem: async (_, raw) => {
    if (fail) throw new Error('disk full');
    stored = raw;
  } });
  await assert.rejects(repo.save(emptyWorkspace()), /disk full/);
  fail = false;
  await repo.save({ version: 1, projects: [createProject('Recovered')] });
  assert.equal((await repo.load()).projects[0]?.title, 'Recovered');
});
test('save snapshots its input before asynchronous writes', async () => {
  let stored = '';
  const repo = createRepository({ getItem: async () => stored, setItem: async (_, raw) => { stored = raw; } });
  const state = { version: 1 as const, projects: [createProject('Original')] };
  const save = repo.save(state);
  state.projects[0]!.title = 'Mutated';
  await save;
  assert.equal((await repo.load()).projects[0]?.title, 'Original');
});
