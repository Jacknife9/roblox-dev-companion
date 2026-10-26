import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, parseTheme, THEME_KEY, type ThemeMode } from './palette';

const ThemeContext = createContext({ mode: 'light' as ThemeMode, color: palettes.light, error: '', toggle: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemeMode | null>(null);
  const [error, setError] = useState('');
  const changed = useRef(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => { let active = true; void AsyncStorage.getItem(THEME_KEY).then(raw => {
    if (active && !changed.current) setPreference(parseTheme(raw));
  }).catch(() => { if (active) setError('Could not read your saved theme.'); }); return () => { active = false; }; }, []);
  const mode = preference ?? (system === 'dark' ? 'dark' : 'light');
  function toggle() {
    const next = mode === 'dark' ? 'light' : 'dark';
    changed.current = true; setPreference(next); setError('');
    writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem(THEME_KEY, next)).catch(() => setError('Theme changed, but could not be saved on this device.'));
  }
  return <ThemeContext.Provider value={{ mode, color: palettes[mode], error, toggle }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
