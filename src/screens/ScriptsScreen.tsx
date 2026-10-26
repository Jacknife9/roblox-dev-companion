import React, { useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { searchTemplates, templates } from '../data/templates';
import { exportText } from '../storage/files';
import { Body, Button, Card, Chips, ErrorMessage, Field, Heading, PageTitle, Pill, color, ui } from '../components/ui';

export function ScriptsScreen({ notify }: { notify: (message: string) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const scroll = useRef<ScrollView>(null);
  const selected = templates.find(t => t.id === selectedId);
  const found = searchTemplates(query, category);
  async function act(fn: () => Promise<void>) {
    try { await fn(); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Could not export this script.'); }
  }
  return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={ui.screen}>
    <PageTitle index="04 / SCRIPT SHELF" title="A useful head start." subtitle="Readable Luau templates. Clear setup. Yours to adapt in Studio." />
    <Card style={{ backgroundColor: color.pale }}><Body>Scripts run in Roblox Studio on your computer. This app helps you read, copy, and share them while planning your build.</Body></Card>
    <Field label="Search scripts" value={query} onChangeText={setQuery} placeholder="Try coins, checkpoint, or touch" autoCapitalize="none" />
    <Chips label="Category" options={['All', 'Economy', 'Progression', 'Controls', 'Game loop']} value={category} onChange={setCategory} />
    <ErrorMessage message={error} />
    {selected && <Card style={{ borderTopWidth: 4, borderTopColor: color.green }}>
      <View style={ui.spread}><Pill>{selected.kind}</Pill><Button label="Close script" tone="quiet" icon="x" compact onPress={() => setSelectedId(null)} /></View>
      <Heading>{selected.title}</Heading><Body>{selected.summary}</Body>
      <View style={{ gap: 8 }}><Text style={ui.eyebrow}>WHERE IT GOES</Text><Body>{selected.placement}</Body></View>
      <View style={{ gap: 8 }}><Text style={ui.eyebrow}>SETUP</Text><Body muted>{selected.setup}</Body></View>
      <View style={{ gap: 8 }}><Text style={ui.eyebrow}>BEFORE YOU SHIP</Text><Body muted>{selected.limits}</Body></View>
      <View style={ui.wrap}><Button label="Copy code" icon="copy" onPress={() => void act(async () => { await Clipboard.setStringAsync(selected.code); notify('Script copied'); })} />
        <Button label={Platform.OS === 'web' ? 'Download .luau' : 'Share .luau'} icon="share" tone="secondary" onPress={() => void act(() => exportText(`${selected.id}.luau`, selected.code, 'text/plain'))} /></View>
      <ScrollView horizontal style={{ backgroundColor: '#172e29', borderRadius: 10 }} contentContainerStyle={{ padding: 16 }}>
        <Text selectable style={ui.code}>{selected.code}</Text>
      </ScrollView>
    </Card>}
    <Text style={ui.caption}>{found.length} of {templates.length} templates</Text>
    {!found.length && <Card><Heading small>No scripts match yet.</Heading><Body muted>Try a shorter search or choose All categories.</Body><Button label="Clear search" tone="secondary" onPress={() => { setQuery(''); setCategory('All'); }} /></Card>}
    {found.map(t => <Card key={t.id}>
      <View style={ui.spread}><Pill>{t.category}</Pill><Text style={ui.caption}>{t.kind}</Text></View>
      <Heading>{t.title}</Heading><Body muted>{t.summary}</Body>
      <Button label={`Open ${t.title}`} icon="code" tone="secondary" onPress={() => { setSelectedId(t.id); scroll.current?.scrollTo({ y: 0, animated: true }); }} />
    </Card>)}
  </ScrollView>;
}
