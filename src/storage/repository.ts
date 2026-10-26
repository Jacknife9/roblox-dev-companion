import { MAX_PROJECTS, MAX_TASKS, PHASES, type Project } from '../core/projects';
export type Workspace = { version: 1; projects: Project[] };
export const STORAGE_KEY = '@dev-companion/workspace/v1';
export const MAX_BACKUP_LENGTH = 1_000_000;
export const emptyWorkspace = (): Workspace => ({ version: 1, projects: [] });
type StorageAdapter = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Backup contains an invalid object.');
  return value as ObjectValue;
}
function text(value: unknown, name: string, max: number, required = true): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`Invalid ${name} in backup.`);
  return value;
}
function date(value: unknown) {
  const raw = text(value, 'date', 40);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(raw) || !Number.isFinite(Date.parse(raw))) throw new Error('Invalid date in backup.');
  return raw;
}
export function parseBackup(raw: string): Workspace {
  if (raw.length > MAX_BACKUP_LENGTH) throw new Error('Backup is too large (maximum 1 MB of text).');
  let decoded: unknown;
  try { decoded = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your projects have not changed.'); }
  const root = object(decoded);
  if (root.version !== 1) throw new Error('Unsupported backup version. Expected version 1.');
  if (!Array.isArray(root.projects) || root.projects.length > MAX_PROJECTS) throw new Error(`Backup must contain at most ${MAX_PROJECTS} projects.`);
  const ids = new Set<string>();
  function unique(value: unknown): string {
    const id = text(value, 'ID', 100);
    if (ids.has(id)) throw new Error('Backup contains a duplicate ID.');
    ids.add(id); return id;
  }
  const projects = root.projects.map(value => {
    const p = object(value);
    if (!PHASES.includes(p.phase as Project['phase'])) throw new Error('Invalid project phase in backup.');
    if (!Array.isArray(p.tasks) || p.tasks.length > MAX_TASKS) throw new Error(`Each project can have at most ${MAX_TASKS} tasks.`);
    return {
      id: unique(p.id), title: text(p.title, 'project name', 100), genre: text(p.genre, 'genre', 40),
      notes: text(p.notes, 'notes', 5000, false), phase: p.phase as Project['phase'],
      createdAt: date(p.createdAt), updatedAt: date(p.updatedAt),
      tasks: p.tasks.map(value => {
        const t = object(value);
        if (typeof t.done !== 'boolean') throw new Error('Invalid task completion value in backup.');
        return { id: unique(t.id), title: text(t.title, 'task', 200), done: t.done };
      }),
    };
  });
  return { version: 1, projects };
}
export function serializeBackup(workspace: Workspace) {
  const raw = JSON.stringify(workspace, null, 2);
  parseBackup(raw);
  return raw;
}
export function createRepository(storage: StorageAdapter) {
  let tail: Promise<void> = Promise.resolve();
  return {
    async load() { const raw = await storage.getItem(STORAGE_KEY); return raw === null ? emptyWorkspace() : parseBackup(raw); },
    readRaw() { return storage.getItem(STORAGE_KEY); },
    save(workspace: Workspace) {
      const raw = serializeBackup(workspace);
      const pending = tail.then(() => storage.setItem(STORAGE_KEY, raw));
      tail = pending.catch(() => undefined);
      return pending;
    },
  };
}
