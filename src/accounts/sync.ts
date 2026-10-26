import { emptyWorkspace, parseBackup, serializeBackup, type Workspace } from '../storage/repository';
export type CloudSnapshot = { workspace: Workspace; revision: number };
type Cache = CloudSnapshot & { dirty: boolean };
type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
type Remote = { get(): Promise<CloudSnapshot>; put(workspace: Workspace, revision: number): Promise<CloudSnapshot> };
export type SyncState = Cache & { ready: boolean; loadError: string; saveError: string; saveStatus: string; syncStatus: string; conflict: CloudSnapshot | null; busy: boolean };
export function validateSnapshot(value: unknown): CloudSnapshot {
  const v = value as Partial<CloudSnapshot> | null;
  if (!v || !Number.isSafeInteger(v.revision) || v.revision! < 0) throw new Error('Invalid sync revision.');
  return { workspace: parseBackup(JSON.stringify(v.workspace)), revision: v.revision! };
}
const same = (a: Workspace, b: Workspace) => serializeBackup(a) === serializeBackup(b);

export class SyncEngine {
  readonly key: string;
  state: SyncState = { workspace: emptyWorkspace(), revision: 0, dirty: false, ready: false, loadError: '', saveError: '', saveStatus: 'Opening device copy…', syncStatus: 'Connecting to sync…', conflict: null, busy: false };
  private listeners = new Set<() => void>();
  private writes = Promise.resolve();
  private savingRevision = 0;
  private generation = 0;
  private running: Promise<void> | null = null;
  private paused = false;
  constructor(accountId: string, private storage: Storage, private remote: Remote) { this.key = `@dev-companion/account/${accountId}/v1`; }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private patch(change: Partial<SyncState>) { this.state = { ...this.state, ...change }; this.listeners.forEach(fn => fn()); }
  async load() {
    try {
      const raw = await this.storage.getItem(this.key);
      if (raw !== null) {
        if (raw.length > 1_001_000) throw new Error('Account cache is too large.');
        const cache = JSON.parse(raw);
        if (typeof cache.dirty !== 'boolean') throw new Error('Invalid account cache.');
        this.patch({ ...validateSnapshot(cache), dirty: cache.dirty });
      }
      this.patch({ ready: true, loadError: '', saveStatus: 'Saved on this device' });
    } catch { this.patch({ ready: false, loadError: 'Could not read this account’s device copy. Export it for recovery before resetting.' }); }
  }
  private save() {
    const { workspace, revision, dirty } = this.state;
    serializeBackup(workspace);
    const raw = JSON.stringify({ workspace, revision, dirty });
    const sequence = ++this.savingRevision;
    this.patch({ saveStatus: 'Saving…', saveError: '' });
    const write = this.writes.catch(() => {}).then(() => this.storage.setItem(this.key, raw));
    this.writes = write;
    // Attach a rejection handler immediately; flush still reports write failure to callers.
    void write.then(() => { if (sequence === this.savingRevision) this.patch({ saveStatus: 'Saved on this device' }); }, () => {
      if (sequence === this.savingRevision) this.patch({ saveStatus: 'Not saved', saveError: 'Device storage could not save your changes. Export a backup or retry before closing.' });
    });
    return write;
  }
  update = (fn: (w: Workspace) => Workspace) => {
    if (!this.state.ready) throw new Error('Wait for your projects to load.');
    const workspace = parseBackup(serializeBackup(fn(this.state.workspace)));
    this.generation++;
    this.patch({ workspace, dirty: true, syncStatus: 'Changes waiting to sync' }); void this.save().catch(() => {});
  };
  flush = () => this.writes;
  suspend = async () => { this.paused = true; await this.running; await this.flush(); };
  resume = () => { this.paused = false; };
  retrySave = () => { void this.save().catch(() => {}); };
  readRaw = () => this.storage.getItem(this.key);
  reset = async () => {
    // A reset deliberately replaces only the local cache; fetch the server copy next.
    this.patch({ workspace: emptyWorkspace(), revision: 0, dirty: false, conflict: null });
    await this.save(); this.patch({ ready: true, loadError: '' }); await this.sync();
  };
  sync = (): Promise<void> => {
    if (!this.state.ready || this.paused) return Promise.resolve();
    if (this.running) return this.running;
    this.running = this.performSync().finally(() => { this.running = null; this.patch({ busy: false }); });
    return this.running;
  };
  private async performSync() {
    this.patch({ busy: true, syncStatus: 'Syncing…' });
    try {
      await this.flush();
      const cloud = validateSnapshot(await this.remote.get());
      if (this.state.conflict) { this.patch({ conflict: cloud, syncStatus: 'Choose which project copy to keep' }); return; }
      if (!this.state.dirty) {
        this.patch({ ...cloud, conflict: null, syncStatus: 'Projects synced' }); await this.save(); return;
      }
      if (same(this.state.workspace, cloud.workspace)) {
        this.patch({ revision: cloud.revision, dirty: false, syncStatus: 'Projects synced' }); await this.save(); return;
      }
      if (cloud.revision !== this.state.revision) {
        this.patch({ conflict: cloud, syncStatus: 'Choose which project copy to keep' }); return;
      }
      const generation = this.generation;
      const result = validateSnapshot(await this.remote.put(this.state.workspace, this.state.revision));
      const dirty = generation !== this.generation;
      this.patch({ revision: result.revision, dirty, syncStatus: dirty ? 'Changes waiting to sync' : 'Projects synced' }); await this.save();
    } catch (e) {
      // A concurrent write after GET is still a conflict, not permission to overwrite.
      const candidate = (e as { snapshot?: unknown }).snapshot;
      if (candidate) {
        try { this.patch({ conflict: validateSnapshot(candidate), syncStatus: 'Choose which project copy to keep' }); return; } catch { /* Keep local data if a server response is invalid. */ }
      }
      this.patch({ syncStatus: e instanceof Error && e.message.includes('Sign in again') ? e.message : 'Sync unavailable. Device copy kept; retry when connected.' });
    }
  }
  async resolve(choice: 'device' | 'cloud') {
    const cloud = this.state.conflict; if (!cloud || this.state.busy) return;
    this.generation++;
    this.patch(choice === 'cloud' ? { ...cloud, dirty: false, conflict: null, syncStatus: 'Cloud copy saved on this device' } : { revision: cloud.revision, dirty: true, conflict: null });
    await this.save(); if (choice === 'device') await this.sync();
  }
}
