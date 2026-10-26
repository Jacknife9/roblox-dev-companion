import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useTheme } from '../theme/ThemeProvider';
import { palettes, type Palette } from '../theme/palette';
export type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 20, tint }: { name: IconName; size?: number; tint?: string }) {
  const { color, ui } = useUI();
  return <Feather name={name} size={size} color={tint ?? color.ink} accessible={false} />;
}
export function Button({ label, onPress, icon, tone = 'primary', disabled = false, compact = false }: {
  label: string; onPress: () => void; icon?: IconName; tone?: 'primary' | 'secondary' | 'danger' | 'quiet'; disabled?: boolean; compact?: boolean;
}) {
  const { color, ui } = useUI();
  const filled = tone === 'primary';
  const tint = filled ? color.onPrimary : tone === 'danger' ? color.error : color.ink;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} aria-disabled={disabled} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, filled && { backgroundColor: color.green, borderColor: color.green },
      tone === 'quiet' && { backgroundColor: 'transparent', borderColor: 'transparent' }, compact && { paddingHorizontal: 12 },
      { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }]}>
    {icon && <Icon name={icon} size={18} tint={tint} />}<Text style={[ui.buttonText, { color: tint }]}>{label}</Text>
  </Pressable>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { color, ui } = useUI();
  return <View style={[ui.card, style]}>{children}</View>;
}
export function Heading({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  const { color, ui } = useUI();
  return <Text accessibilityRole="header" style={small ? ui.h3 : ui.h2}>{children}</Text>;
}
export function Body({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  const { color, ui } = useUI();
  return <Text style={[ui.body, muted && { color: color.muted }]}>{children}</Text>;
}
export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const { color, ui } = useUI();
  return <View style={ui.field}><Text style={ui.label}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor={color.muted}
      style={[ui.input, props.multiline && { minHeight: 100, textAlignVertical: 'top' }, props.style]} />
    {hint && <Text style={ui.caption}>{hint}</Text>}
  </View>;
}
export function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  const { color, ui } = useUI();
  return <View style={ui.field}><Text style={ui.label}>{label}</Text><View style={ui.wrap}>
    {options.map(option => <Pressable key={option} accessibilityRole="button" accessibilityLabel={`${label}: ${option}`}
      accessibilityState={{ selected: option === value }} aria-pressed={option === value} onPress={() => onChange(option)}
      style={({ pressed }) => [ui.chip, option === value && { backgroundColor: color.green, borderColor: color.green }, pressed && { opacity: 0.7 }]}>
      <Text style={[ui.chipText, option === value && { color: color.onPrimary }]}>{option}</Text>
    </Pressable>)}
  </View></View>;
}
export function Pill({ children }: { children: React.ReactNode }) {
  const { color, ui } = useUI();
  return <View style={ui.pill}><Text style={ui.pillText}>{children}</Text></View>;
}
export function ErrorMessage({ message }: { message: string }) {
  const { color, ui } = useUI();
  if (!message) return null;
  return <View accessibilityRole="alert" style={ui.error}><Icon name="alert-circle" tint={color.error} /><Text style={[ui.body, { color: color.error, flex: 1 }]}>{message}</Text></View>;
}
export function PageTitle({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  const { color, ui } = useUI();
  return <View style={ui.pageTitle}><View style={{ width: 44, height: 6, borderRadius: 3, backgroundColor: color.lime }} /><Text style={ui.eyebrow}>{index}</Text><Text accessibilityRole="header" style={ui.h1}>{title}</Text><Body muted>{subtitle}</Body></View>;
}
const createStyles = (color: Palette) => StyleSheet.create({
  screen: { padding: 24, gap: 24, paddingBottom: 40, width: '100%', maxWidth: 1120, alignSelf: 'center' },
  pageTitle: { gap: 8, marginBottom: 4 }, eyebrow: { color: color.green, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  h1: { color: color.ink, fontSize: 38, lineHeight: 44, fontWeight: '900', letterSpacing: -1.4 },
  h2: { color: color.ink, fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.6 },
  h3: { color: color.ink, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  body: { color: color.ink, fontSize: 15, lineHeight: 23 }, caption: { color: color.muted, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: color.surface, borderColor: color.line, borderWidth: 1, borderRadius: 22, padding: 22, gap: 16, boxShadow: '0 1px 2px rgba(10, 12, 40, 0.05), 0 10px 30px rgba(10, 12, 40, 0.07)' },
  button: { minHeight: 46, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  field: { gap: 8 }, label: { color: color.ink, fontSize: 13, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: color.line, borderRadius: 12, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, color: color.ink, fontSize: 15, backgroundColor: color.surface },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }, row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  spread: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: color.line, borderRadius: 999, backgroundColor: color.surface },
  chipText: { color: color.ink, fontSize: 13, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', backgroundColor: color.lime, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9 },
  pillText: { color: '#121430', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  divider: { height: 1, backgroundColor: color.line }, error: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, backgroundColor: color.errorBg, borderRadius: 10 },
  code: { color: color.codeText, fontFamily: 'monospace', fontSize: 12, lineHeight: 21 },
});

const styles = { light: createStyles(palettes.light), dark: createStyles(palettes.dark) };
export function useUI() { const theme = useTheme(); return { ...theme, ui: styles[theme.mode] }; }
