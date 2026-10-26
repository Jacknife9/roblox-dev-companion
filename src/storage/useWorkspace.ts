import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRepository, emptyWorkspace, serializeBackup, type Workspace } from './repository';

export function useWorkspace() {
  const repo = useRef(createRepository(AsyncStorage)).current;
  const current = useRef(emptyWorkspace());
  const [workspace, setWorkspace] = useState(current.current);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved on this device');
  const [saveError, setSaveError] = useState('');
  const revision = useRef(0);
  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await repo.load();
      current.current = data; setWorkspace(data); setReady(true);
    } catch (error) { setLoadError(error instanceof Error ? error.message : 'Could not read device storage.'); }
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const persist = useCallback((next: Workspace) => {
    serializeBackup(next);
    current.current = next; setWorkspace(next);
    const n = ++revision.current;
    setSaveStatus('Saving…'); setSaveError('');
    void repo.save(next).then(() => {
      if (n === revision.current) setSaveStatus('Saved on this device');
    }).catch(() => {
      if (n === revision.current) {
        setSaveStatus('Not saved'); setSaveError('Device storage could not save your changes. Export a backup or retry before closing the app.');
      }
    });
  }, [repo]);
  const update = useCallback((fn: (previous: Workspace) => Workspace) => {
    if (!ready) throw new Error('Wait for your projects to load.');
    persist(fn(current.current));
  }, [ready, persist]);
  const reset = useCallback(async () => {
    const fresh = emptyWorkspace();
    await repo.save(fresh);
    current.current = fresh; setWorkspace(fresh); setLoadError(''); setReady(true);
  }, [repo]);
  return { workspace, ready, loadError, saveStatus, saveError, load, reset, update,
    retrySave: () => persist(current.current), readRaw: repo.readRaw };
}
