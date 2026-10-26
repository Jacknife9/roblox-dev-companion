import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

export const color = {
  paper: '#f4f6f1', surface: '#ffffff', ink: '#172e29', muted: '#53685f', line: '#dbe3d8',
  green: '#245340', lime: '#d6ef9b', pale: '#e8efdf', error: '#a33127', errorBg: '#fff0eb',
};
export type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 20, tint = color.ink }: { name: IconName; size?: number; tint?: string }) {
  return <Feather name={name} size={size} color={tint} accessible={false} />;
}
export function Button({ label, onPress, icon, tone = 'primary', disabled = false, compact = false }: {
  label: string; onPress: () => void; icon?: IconName; tone?: 'primary' | 'secondary' | 'danger' | 'quiet'; disabled?: boolean; compact?: boolean;
}) {
  const filled = tone === 'primary';
  const tint = filled ? '#ffffff' : tone === 'danger' ? color.error : color.ink;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} aria-disabled={disabled} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, filled && { backgroundColor: color.green, borderColor: color.green },
      tone === 'quiet' && { backgroundColor: 'transparent', borderColor: 'transparent' }, compact && { paddingHorizontal: 12 },
      { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }]}>
    {icon && <Icon name={icon} size={18} tint={tint} />}<Text style={[ui.buttonText, { color: tint }]}>{label}</Text>
  </Pressable>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[ui.card, style]}>{children}</View>;
}
export function Heading({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  return <Text accessibilityRole="header" style={small ? ui.h3 : ui.h2}>{children}</Text>;
}
export function Body({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[ui.body, muted && { color: color.muted }]}>{children}</Text>;
}
export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return <View style={ui.field}><Text style={ui.label}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor={color.muted}
      style={[ui.input, props.multiline && { minHeight: 100, textAlignVertical: 'top' }, props.style]} />
    {hint && <Text style={ui.caption}>{hint}</Text>}
  </View>;
}
export function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return <View style={ui.field}><Text style={ui.label}>{label}</Text><View style={ui.wrap}>
    {options.map(option => <Pressable key={option} accessibilityRole="button" accessibilityLabel={`${label}: ${option}`}
      accessibilityState={{ selected: option === value }} aria-pressed={option === value} onPress={() => onChange(option)}
      style={({ pressed }) => [ui.chip, option === value && { backgroundColor: color.ink, borderColor: color.ink }, pressed && { opacity: 0.7 }]}>
      <Text style={[ui.chipText, option === value && { color: '#fff' }]}>{option}</Text>
    </Pressable>)}
  </View></View>;
}
export function Pill({ children }: { children: React.ReactNode }) {
  return <View style={ui.pill}><Text style={ui.pillText}>{children}</Text></View>;
}
export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <View accessibilityRole="alert" style={ui.error}><Icon name="alert-circle" tint={color.error} /><Text style={[ui.body, { color: color.error, flex: 1 }]}>{message}</Text></View>;
}
export function PageTitle({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  return <View style={ui.pageTitle}><Text style={ui.eyebrow}>{index}</Text><Text accessibilityRole="header" style={ui.h1}>{title}</Text><Body muted>{subtitle}</Body></View>;
}
export const ui = StyleSheet.create({
  screen: { padding: 24, gap: 24, paddingBottom: 40, width: '100%', maxWidth: 1120, alignSelf: 'center' },
  pageTitle: { gap: 8, marginBottom: 4 }, eyebrow: { color: color.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  h1: { color: color.ink, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1 },
  h2: { color: color.ink, fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 },
  h3: { color: color.ink, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  body: { color: color.ink, fontSize: 15, lineHeight: 23 }, caption: { color: color.muted, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: color.surface, borderColor: color.line, borderWidth: 1, borderRadius: 16, padding: 20, gap: 16 },
  button: { minHeight: 46, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  field: { gap: 8 }, label: { color: color.ink, fontSize: 13, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: color.line, borderRadius: 10, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, color: color.ink, fontSize: 15, backgroundColor: color.surface },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }, row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  spread: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: color.line, borderRadius: 9, backgroundColor: color.surface },
  chipText: { color: color.muted, fontSize: 13, fontWeight: '600' },
  pill: { alignSelf: 'flex-start', backgroundColor: color.pale, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 9 },
  pillText: { color: color.green, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  divider: { height: 1, backgroundColor: color.line }, error: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, backgroundColor: color.errorBg, borderRadius: 10 },
  code: { color: '#e4f1dc', fontFamily: 'monospace', fontSize: 12, lineHeight: 21 },
});
