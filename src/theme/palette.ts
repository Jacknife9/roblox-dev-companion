export const palettes = {
  // `green` is the accent token name kept from 0.3 for a small diff; it is now electric indigo.
  light: {
    paper: '#f2f3f9', surface: '#ffffff', ink: '#121430', muted: '#555b7a', line: '#dfe2f0',
    green: '#4b3fe0', lime: '#c8f53c', pale: '#ecebff', error: '#c0213a', errorBg: '#fff0f2',
    onPrimary: '#ffffff', onSelected: '#ffffff', brand: '#121430', codeSurface: '#121430', codeText: '#e4e6ff',
  },
  dark: {
    paper: '#0a0c18', surface: '#14172b', ink: '#eef0ff', muted: '#a4a9c8', line: '#2b3052',
    green: '#9294ff', lime: '#c8f53c', pale: '#1e2144', error: '#ff8fa0', errorBg: '#3b1825',
    onPrimary: '#0a0c18', onSelected: '#0a0c18', brand: '#4b3fe0', codeSurface: '#06070f', codeText: '#e4e6ff',
  },
};
export type Palette = typeof palettes.light;
export type ThemeMode = 'light' | 'dark';
export const THEME_KEY = '@dev-companion/theme/v1';
export function parseTheme(value: string | null): ThemeMode | null {
  return value === 'light' || value === 'dark' ? value : null;
}
