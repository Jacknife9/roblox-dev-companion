import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Body, Button, Card, ErrorMessage, Heading, Icon, type IconName, useUI } from './src/components/ui';
import { IdeasScreen } from './src/screens/IdeasScreen';
import { BalanceScreen } from './src/screens/BalanceScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { ScriptsScreen } from './src/screens/ScriptsScreen';
import { useWorkspace } from './src/storage/useWorkspace';
import { exportText } from './src/storage/files';
import { createProject, MAX_PROJECTS } from './src/core/projects';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { palettes, type Palette } from './src/theme/palette';
import type { Idea } from './src/core/ideas';
import { AuthProvider, useAuth } from './src/accounts/AuthProvider';
import { AccountPanel } from './src/accounts/AccountPanel';
import { useSyncedWorkspace } from './src/accounts/useSyncedWorkspace';

const tabs: { name: string; icon: IconName; hint: string }[] = [
  { name: 'Ideas', icon: 'zap', hint: 'Find your next build' }, { name: 'Balance', icon: 'sliders', hint: 'Tune the numbers' },
  { name: 'Projects', icon: 'folder', hint: 'Keep moving' }, { name: 'Scripts', icon: 'code', hint: 'Start with a pattern' },
];
export default function App() {
  return <ThemeProvider><AuthProvider><Root /></AuthProvider></ThemeProvider>;
}
function Root() {
  const { mode } = useTheme(); const s = styles[mode];
  return <SafeAreaProvider><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><SafeAreaView style={s.safe}><SessionWorkbench /></SafeAreaView></SafeAreaProvider>;
}
function SessionWorkbench() {
  const { user } = useAuth();
  return user ? <AccountWorkbench key={user.id} id={user.id} /> : <GuestWorkbench />;
}
function GuestWorkbench() { const store = useWorkspace(); return <Workbench store={store} />; }
function AccountWorkbench({ id }: { id: string }) { const store = useSyncedWorkspace(id); return <Workbench store={store} synced={store} />; }
function Workbench({ store, synced }: { store: ReturnType<typeof useWorkspace>; synced?: ReturnType<typeof useSyncedWorkspace> }) {
  const { color, ui, mode, toggle, error: themeError } = useUI();
  const s = styles[mode];
  const auth = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [tab, setTab] = useState('Ideas');
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [about, setAbout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const wide = useWindowDimensions().width >= 950;
  const compactHeader = useWindowDimensions().width < 450;
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
      onPress={() => { setTab(t.name); setAccountOpen(false); setMessage(''); setError(''); }} style={({ pressed }) => [wide ? s.sideTab : s.bottomTab, tab === t.name && !accountOpen && { backgroundColor: wide ? color.pale : color.paper }, pressed && { opacity: 0.6 }]}>
      <Icon name={t.icon} tint={tab === t.name ? color.green : color.muted} size={21} />
      <View style={{ gap: 3 }}><Text style={{ color: tab === t.name ? color.ink : color.muted, fontSize: wide ? 14 : 11, fontWeight: '700', textAlign: wide ? 'left' : 'center' }}>{t.name}</Text>
        {wide && <Text style={ui.caption}>{t.hint}</Text>}</View>
    </Pressable>)}
  </View>;
  return <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={s.header}><View style={[ui.row, { flexShrink: 1 }]}>{!compactHeader && <View style={s.logo}><Icon name="terminal" tint={color.lime} /></View>}<View><Text style={s.brand}>DEV COMPANION</Text><Text style={ui.caption}>Roblox creator toolkit</Text></View></View>
      <View style={{ flexDirection: 'row' }}><Pressable accessibilityRole="button" accessibilityLabel={auth.user ? 'Open account' : 'Sign in or create account'} onPress={() => setAccountOpen(!accountOpen)} style={{ padding: 12, minHeight: 44 }}><Icon name={auth.user ? 'user-check' : 'user'} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggle} style={{ padding: 12, minHeight: 44 }}><Icon name={mode === 'dark' ? 'sun' : 'moon'} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="About this app" onPress={() => setAbout(!about)} style={{ padding: 12, minHeight: 44 }}><Icon name="info" /></Pressable></View>
    </View>
    {!!themeError && <ErrorMessage message={themeError} />}
    {about && <View style={s.notice}><Body>MVP v0.2.0 · All tools are free. No in-app purchases. Not affiliated with or endorsed by Roblox Corporation. Guest projects stay on this device. Signed-in projects sync to your configured account service. Exported copies go where you choose.</Body></View>}
    <View style={[s.flex, { flexDirection: 'row' }]}>
      {wide && <View style={s.sidebar}><Text style={[ui.eyebrow, { padding: 20 }]}>YOUR WORKBENCH</Text>{nav}<View style={{ flex: 1 }} /><View style={{ padding: 20, gap: 8 }}><Icon name={auth.user ? 'cloud' : 'wifi-off'} size={18} /><Text style={ui.caption}>Made for the next idea.{`\n`}Ready when you are.</Text><Text style={ui.caption}>v0.2.0 / {auth.user ? 'connected workspace' : 'guest workspace'}</Text></View></View>}
      <View style={s.flex}>
        <View style={s.status}><View style={[s.dot, store.saveError && { backgroundColor: color.error }]} /><Text accessibilityLiveRegion="polite" style={ui.caption}>{store.ready ? store.saveStatus : 'Opening your workspace…'}</Text></View>
        {!!synced && <View style={[s.notice, ui.spread]}><Text accessibilityLiveRegion="polite" style={[ui.caption, { flexShrink: 1 }]}>{synced.syncStatus}</Text><Button label="Sync projects" compact tone="quiet" disabled={synced.busy || !synced.ready} onPress={() => void synced.engine.sync()} /></View>}
        {!!synced?.conflict && <View style={s.notice}><Heading small>Projects changed on another device</Heading><Body>Your device has {synced.workspace.projects.length} projects; the cloud copy has {synced.conflict.workspace.projects.length}. Export a backup from Projects before replacing a copy. Choosing applies to the entire workspace, including deletions.</Body><View style={ui.wrap}><Button label="Keep device copy" disabled={synced.busy} onPress={() => void synced.engine.resolve('device').catch(e => setError(String(e)))} /><Button label="Use cloud copy" tone="secondary" disabled={synced.busy} onPress={() => void synced.engine.resolve('cloud').catch(e => setError(String(e)))} /></View></View>}
        {!!message && <View style={[s.notice, ui.spread]}><Text accessibilityLiveRegion="polite" style={ui.body}>{message}</Text><Button label="Dismiss" compact tone="quiet" onPress={() => setMessage('')} /></View>}
        {!!error && <ErrorMessage message={error} />}
        {!!store.saveError && <View style={s.notice}><ErrorMessage message={store.saveError} /><Button label="Retry save" tone="secondary" onPress={store.retrySave} /></View>}
        {accountOpen && <AccountPanel engine={synced?.engine} close={() => setAccountOpen(false)} />}
        <View style={[s.flex, accountOpen && s.hidden]}>{!store.ready ? <View style={[ui.screen, { flex: 1, justifyContent: 'center' }]}>
          {store.loadError ? <Card><Heading>Your saved data needs attention.</Heading><ErrorMessage message={store.loadError} /><Body muted>The stored copy has been kept. Retry reading it or export it for recovery.</Body><Button label="Retry loading" onPress={() => void store.load()} />
            <Button label="Export stored data" tone="secondary" onPress={() => void store.readRaw().then(raw => exportText('dev-companion-recovery.txt', raw ?? '', 'text/plain')).catch(e => setError(String(e)))} />
            {confirmReset ? <><Body>Start fresh and replace the stored copy? Export it first if you need it.</Body><Button label="Confirm start fresh" tone="danger" onPress={() => void store.reset().catch(e => setError(String(e)))} /><Button label="Cancel reset" tone="secondary" onPress={() => setConfirmReset(false)} /></> : <Button label="Start fresh" tone="danger" onPress={() => setConfirmReset(true)} />}
          </Card> : <ActivityIndicator color={color.green} accessibilityLabel="Loading projects" />}
        </View> : <>
          <View style={[s.flex, tab !== 'Ideas' && s.hidden]}><IdeasScreen onSave={saveIdea} /></View>
          <View style={[s.flex, tab !== 'Balance' && s.hidden]}><BalanceScreen /></View>
          <View style={[s.flex, tab !== 'Projects' && s.hidden]}><ProjectsScreen workspace={store.workspace} selectedId={selected} onSelect={setSelected} onUpdate={store.update} notify={notify} /></View>
          <View style={[s.flex, tab !== 'Scripts' && s.hidden]}><ScriptsScreen notify={notify} /></View>
        </>}</View>
      </View>
    </View>
    {!wide && nav}
  </KeyboardAvoidingView>;
}
const createStyles = (color: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.paper }, flex: { flex: 1, minHeight: 0 }, hidden: { display: 'none' },
  header: { minHeight: 80, backgroundColor: color.surface, borderBottomWidth: 1, borderColor: color.line, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  logo: { width: 40, height: 40, backgroundColor: color.brand, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brand: { color: color.ink, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  sidebar: { width: 236, backgroundColor: color.surface, borderRightWidth: 1, borderColor: color.line },
  sideNav: { gap: 8, padding: 12 }, sideTab: { minHeight: 64, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottomNav: { flexDirection: 'row', backgroundColor: color.surface, borderTopWidth: 1, borderColor: color.line, padding: 6, gap: 4 },
  bottomTab: { minHeight: 58, flex: 1, gap: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  status: { minHeight: 36, paddingHorizontal: 24, flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 6, width: 6, backgroundColor: color.green, borderRadius: 3 },
  notice: { backgroundColor: color.pale, padding: 16, gap: 8 },
});

const styles = { light: createStyles(palettes.light), dark: createStyles(palettes.dark) };
