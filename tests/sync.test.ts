import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncEngine, type CloudSnapshot } from '../src/accounts/sync';
import { emptyWorkspace, type Workspace } from '../src/storage/repository';
import { createProject } from '../src/core/projects';
const build = (title: string): Workspace => ({ version: 1, projects: [createProject(title, 'Obby')] });
function fixture() {
  const values = new Map<string, string>();
  const storage = { getItem: async (k: string) => values.get(k) ?? null, setItem: async (k: string, v: string) => { values.set(k, v); } };
  let cloud: CloudSnapshot = { workspace: emptyWorkspace(), revision: 0 };
  let offline = false;
  const remote = { get: async () => { if (offline) throw Error('offline'); return structuredClone(cloud); }, put: async (workspace: Workspace, revision: number) => {
    if (offline) throw Error('offline'); if (revision !== cloud.revision) throw Error('conflict'); cloud = { workspace: structuredClone(workspace), revision: revision + 1 }; return structuredClone(cloud);
  } };
  return { values, storage, remote, setCloud: (s: CloudSnapshot) => { cloud = s; }, offline: (v: boolean) => { offline = v; } };
}
test('two devices sync; accounts and guest storage remain separate', async () => {
  const f = fixture(), second = fixture();
  const a = new SyncEngine('alice', f.storage, f.remote), b = new SyncEngine('alice', second.storage, f.remote), other = new SyncEngine('bob', f.storage, second.remote);
  await Promise.all([a.load(), b.load(), other.load()]);
  a.update(() => build('Shared')); await a.sync(); await b.sync();
  assert.equal(b.state.workspace.projects[0]?.title, 'Shared'); assert.equal(a.state.dirty, false);
  assert.equal(other.state.workspace.projects.length, 0); assert.equal(f.values.has('@dev-companion/workspace/v1'), false);
});
test('offline changes survive reload; divergent revisions need an explicit choice', async () => {
  const f = fixture(); let a = new SyncEngine('alice', f.storage, f.remote); await a.load(); await a.sync();
  f.offline(true); a.update(() => build('Offline')); await a.sync();
  a = new SyncEngine('alice', f.storage, f.remote); await a.load(); assert.equal(a.state.dirty, true);
  f.offline(false); f.setCloud({ workspace: build('Other device'), revision: 1 }); await a.sync();
  assert.ok(a.state.conflict); assert.equal(a.state.workspace.projects[0]?.title, 'Offline');
  await a.resolve('device'); assert.equal(a.state.dirty, false); assert.equal(a.state.revision, 2);
  a.update(() => build('Draft')); f.setCloud({ workspace: build('Cloud choice'), revision: 3 }); await a.sync(); await a.resolve('cloud');
  assert.equal(a.state.workspace.projects[0]?.title, 'Cloud choice'); assert.equal(a.state.dirty, false);
});
test('edits during an upload stay dirty and sync next without being overwritten', async () => {
  const f = fixture(); let release!: (s: CloudSnapshot) => void;
  let captured!: Workspace;
  const remote = { get: f.remote.get, put: (w: Workspace, _r: number) => { captured = w; return new Promise<CloudSnapshot>(r => { release = r; }); } };
  const a = new SyncEngine('alice', f.storage, remote); await a.load(); a.update(() => build('First'));
  const pending = a.sync();
  while (!release) await new Promise(r => setTimeout(r, 1));
  a.update(() => build('New edit')); release({ workspace: captured, revision: 1 }); await pending;
  assert.equal(a.state.workspace.projects[0]?.title, 'New edit'); assert.equal(a.state.dirty, true); assert.equal(a.state.revision, 1);
  await a.flush();
  const reloaded = new SyncEngine('alice', f.storage, f.remote); await reloaded.load(); assert.equal(reloaded.state.dirty, true); assert.equal(reloaded.state.revision, 1);
});
test('a lost successful upload response is recognized on retry', async () => {
  const f = fixture(); let first = true;
  const remote = { get: f.remote.get, put: async (w: Workspace, r: number) => { const result = await f.remote.put(w, r); if (first) { first = false; throw Error('connection lost'); } return result; } };
  const a = new SyncEngine('alice', f.storage, remote); await a.load(); a.update(() => build('Saved remotely'));
  await a.sync(); assert.equal(a.state.dirty, true); await a.sync(); assert.equal(a.state.dirty, false); assert.equal(a.state.conflict, null);
});
test('corrupt local cache blocks sync and is preserved for recovery', async () => {
  const f = fixture(); const a = new SyncEngine('alice', f.storage, f.remote); f.values.set(a.key, '{bad');
  await a.load(); assert.equal(a.state.ready, false); assert.ok(a.state.loadError); await a.sync(); assert.equal(f.values.get(a.key), '{bad');
});
