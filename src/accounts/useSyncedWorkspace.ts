import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncEngine } from './sync';
import { workspaceRemote } from './api';

export function useSyncedWorkspace(userId: string) {
  const engine = useMemo(() => new SyncEngine(userId, AsyncStorage, workspaceRemote), [userId]);
  const state = useSyncExternalStore(engine.subscribe, () => engine.state, () => engine.state);
  useEffect(() => {
    let active = true;
    void engine.load().then(() => { if (active) void engine.sync(); });
    const interval = setInterval(() => { if (active) void engine.sync(); }, 30_000);
    const foreground = AppState.addEventListener('change', value => { if (active && value === 'active') void engine.sync(); });
    return () => { active = false; clearInterval(interval); foreground.remove(); };
  }, [engine]);
  useEffect(() => {
    if (!state.ready || !state.dirty || state.conflict || state.busy) return;
    const timer = setTimeout(() => void engine.sync(), 800); return () => clearTimeout(timer);
    // Retry errors on the interval/manual action, not in an immediate loop.
  }, [engine, state.workspace, state.revision, state.ready, state.dirty, state.conflict]);
  return { ...state, update: engine.update, load: () => engine.load(), reset: engine.reset, retrySave: engine.retrySave, readRaw: engine.readRaw, engine };
}
