import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Body, Button, Card, ErrorMessage, Heading, Icon, type IconName, color, ui } from './src/components/ui';
import { IdeasScreen } from './src/screens/IdeasScreen';
import { BalanceScreen } from './src/screens/BalanceScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { ScriptsScreen } from './src/screens/ScriptsScreen';
import { useWorkspace } from './src/storage/useWorkspace';
import { exportText } from './src/storage/files';
import { createProject, MAX_PROJECTS } from './src/core/projects';
import type { Idea } from './src/core/ideas';

const tabs: { name: string; icon: IconName; hint: string }[] = [
  { name: 'Ideas', icon: 'zap', hint: 'Find your next build' }, { name: 'Balance', icon: 'sliders', hint: 'Tune the numbers' },
  { name: 'Projects', icon: 'folder', hint: 'Keep moving' }, { name: 'Scripts', icon: 'code', hint: 'Start with a pattern' },
];
export default function App() {
  return <SafeAreaProvider><StatusBar style="dark" /><SafeAreaView style={s.safe}><Workbench /></SafeAreaView></SafeAreaProvider>;
}
function Workbench() {
  const store = useWorkspace();
  const [tab, setTab] = useState('Ideas');
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [about, setAbout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const wide = useWindowDimensions().width >= 950;
  function notify(text: string) { setMessage(text); }
  function saveIdea(idea: Idea) {
    try {
      const p = createProject(idea.title, idea.genre, `${idea.loop}\n\nTwist: ${idea.hook}\n\nProgression: ${idea.progression}\n\nScope: ${idea.scopeNote}`, idea.tasks);
      store.update(previous => {
        if (previous.projects.length >= MAX_PROJECTS) throw new Error(`You have reached ${MAX_PROJECTS} projects. Export and remove older builds first.`);
        return { ...previous, projects: [p, ...previous.projects] };
      });
      setSelected(p.id); setTab('Projects'); notify('Idea saved with four starter tasks'); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create project.'); }
  }
  const nav = <View style={wide ? s.sideNav : s.bottomNav}>
    {tabs.map(t => <Pressable key={t.name} accessibilityRole="tab" accessibilityLabel={t.name} accessibilityState={{ selected: tab === t.name }} aria-selected={tab === t.name}
      onPress={() => { setTab(t.name); setMessage(''); setError(''); }} style={({ pressed }) => [wide ? s.sideTab : s.bottomTab, tab === t.name && { backgroundColor: wide ? color.pale : color.paper }, pressed && { opacity: 0.6 }]}>
      <Icon name={t.icon} tint={tab === t.name ? color.green : color.muted} size={21} />
      <View style={{ gap: 3 }}><Text style={{ color: tab === t.name ? color.ink : color.muted, fontSize: wide ? 14 : 11, fontWeight: '700', textAlign: wide ? 'left' : 'center' }}>{t.name}</Text>
        {wide && <Text style={ui.caption}>{t.hint}</Text>}</View>
    </Pressable>)}
  </View>;
  return <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={s.header}><View style={ui.row}><View style={s.logo}><Icon name="terminal" tint={color.lime} /></View><View><Text style={s.brand}>DEV COMPANION</Text><Text style={ui.caption}>Unofficial Roblox creator toolkit</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="About this app" onPress={() => setAbout(!about)} style={{ padding: 12, minHeight: 44 }}><Icon name="info" /></Pressable>
    </View>
    {about && <View style={s.notice}><Body>Offline MVP v0.1.0 · All tools are free. No in-app purchases. Not affiliated with or endorsed by Roblox Corporation. Project data stays on this device; exported copies go where you choose.</Body></View>}
    <View style={[s.flex, { flexDirection: 'row' }]}>
      {wide && <View style={s.sidebar}><Text style={[ui.eyebrow, { padding: 20 }]}>YOUR WORKBENCH</Text>{nav}<View style={{ flex: 1 }} /><View style={{ padding: 20, gap: 8 }}><Icon name="wifi-off" size={18} /><Text style={ui.caption}>Made for the next idea.{`\n`}Ready when you are.</Text><Text style={ui.caption}>v0.1.0 / offline edition</Text></View></View>}
      <View style={s.flex}>
        <View style={s.status}><View style={[s.dot, store.saveError && { backgroundColor: color.error }]} /><Text accessibilityLiveRegion="polite" style={ui.caption}>{store.ready ? store.saveStatus : 'Opening your workspace…'}</Text></View>
        {!!message && <View style={[s.notice, ui.spread]}><Text accessibilityLiveRegion="polite" style={ui.body}>{message}</Text><Button label="Dismiss" compact tone="quiet" onPress={() => setMessage('')} /></View>}
        {!!error && <ErrorMessage message={error} />}
        {!!store.saveError && <View style={s.notice}><ErrorMessage message={store.saveError} /><Button label="Retry save" tone="secondary" onPress={store.retrySave} /></View>}
        {!store.ready ? <View style={[ui.screen, { flex: 1, justifyContent: 'center' }]}>
          {store.loadError ? <Card><Heading>Your saved data needs attention.</Heading><ErrorMessage message={store.loadError} /><Body muted>The stored copy has been kept. Retry reading it or export it for recovery.</Body><Button label="Retry loading" onPress={() => void store.load()} />
            <Button label="Export stored data" tone="secondary" onPress={() => void store.readRaw().then(raw => exportText('dev-companion-recovery.txt', raw ?? '', 'text/plain')).catch(e => setError(String(e)))} />
            {confirmReset ? <><Body>Start fresh and replace the stored copy? Export it first if you need it.</Body><Button label="Confirm start fresh" tone="danger" onPress={() => void store.reset().catch(e => setError(String(e)))} /><Button label="Cancel reset" tone="secondary" onPress={() => setConfirmReset(false)} /></> : <Button label="Start fresh" tone="danger" onPress={() => setConfirmReset(true)} />}
          </Card> : <ActivityIndicator color={color.green} accessibilityLabel="Loading projects" />}
        </View> : <>
          <View style={[s.flex, tab !== 'Ideas' && s.hidden]}><IdeasScreen onSave={saveIdea} /></View>
          <View style={[s.flex, tab !== 'Balance' && s.hidden]}><BalanceScreen /></View>
          <View style={[s.flex, tab !== 'Projects' && s.hidden]}><ProjectsScreen workspace={store.workspace} selectedId={selected} onSelect={setSelected} onUpdate={store.update} notify={notify} /></View>
          <View style={[s.flex, tab !== 'Scripts' && s.hidden]}><ScriptsScreen notify={notify} /></View>
        </>}
      </View>
    </View>
    {!wide && nav}
  </KeyboardAvoidingView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.paper }, flex: { flex: 1, minHeight: 0 }, hidden: { display: 'none' },
  header: { minHeight: 80, backgroundColor: color.surface, borderBottomWidth: 1, borderColor: color.line, paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  logo: { width: 40, height: 40, backgroundColor: color.ink, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brand: { color: color.ink, fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  sidebar: { width: 236, backgroundColor: color.surface, borderRightWidth: 1, borderColor: color.line },
  sideNav: { gap: 8, padding: 12 }, sideTab: { minHeight: 64, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottomNav: { flexDirection: 'row', backgroundColor: color.surface, borderTopWidth: 1, borderColor: color.line, padding: 6, gap: 4 },
  bottomTab: { minHeight: 58, flex: 1, gap: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  status: { minHeight: 36, paddingHorizontal: 24, flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 6, width: 6, backgroundColor: color.green, borderRadius: 3 },
  notice: { backgroundColor: color.pale, padding: 16, gap: 8 },
});
