export const palettes = {
  light: {
    paper: '#f4f6f1', surface: '#ffffff', ink: '#172e29', muted: '#53685f', line: '#dbe3d8',
    green: '#245340', lime: '#d6ef9b', pale: '#e8efdf', error: '#a33127', errorBg: '#fff0eb',
    onPrimary: '#ffffff', onSelected: '#ffffff', brand: '#172e29', codeSurface: '#172e29', codeText: '#e4f1dc',
  },
  dark: {
    paper: '#101a17', surface: '#192722', ink: '#e8f1e9', muted: '#afc1b5', line: '#40574b',
    green: '#b9df91', lime: '#d6ef9b', pale: '#293c30', error: '#ffb4a8', errorBg: '#452822',
    onPrimary: '#192722', onSelected: '#192722', brand: '#245340', codeSurface: '#0b1410', codeText: '#e4f1dc',
  },
};
export type Palette = typeof palettes.light;
export type ThemeMode = 'light' | 'dark';
export const THEME_KEY = '@dev-companion/theme/v1';
export function parseTheme(value: string | null): ThemeMode | null {
  return value === 'light' || value === 'dark' ? value : null;
}
