import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { createProject, MAX_PROJECTS, projectProgress, type Project } from '../core/projects';
import { parseBackup, serializeBackup, type Workspace } from '../storage/repository';
import { exportText, pickBackup } from '../storage/files';
import { Body, Button, Card, ErrorMessage, Field, Heading, Icon, PageTitle, Pill, color, ui } from '../components/ui';
import { ProjectEditor } from './ProjectEditor';

export function ProjectsScreen({ workspace, selectedId, onSelect, onUpdate, notify }: {
  workspace: Workspace; selectedId: string | null; onSelect: (id: string | null) => void;
  onUpdate: (fn: (previous: Workspace) => Workspace) => void; notify: (message: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Workspace | null>(null);
  const [paste, setPaste] = useState(false);
  const [backupText, setBackupText] = useState('');
  const [busy, setBusy] = useState(false);
  const project = workspace.projects.find(p => p.id === selectedId);
  const taskCount = workspace.projects.reduce((sum, p) => sum + p.tasks.filter(t => !t.done).length, 0);
  async function act(fn: () => void | Promise<void>) {
    try { setBusy(true); await fn(); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not complete this action.'); }
    finally { setBusy(false); }
  }
  function addProject() {
    void act(() => {
      const next = createProject(title);
      onUpdate(previous => {
        if (previous.projects.length >= MAX_PROJECTS) throw new Error(`Maximum ${MAX_PROJECTS} projects. Export and remove older projects first.`);
        return { ...previous, projects: [next, ...previous.projects] };
      });
      setTitle(''); setCreating(false); onSelect(next.id); notify('Project created');
    });
  }
  function changeProject(next: Project) {
    onUpdate(previous => ({ ...previous, projects: previous.projects.map(p => p.id === next.id ? next : p) }));
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.screen}>
    <PageTitle index="03 / YOUR WORKSPACE" title="Small steps. Playable progress." subtitle="Keep your next build moving, one useful task at a time." />
    <View style={ui.spread}><View style={ui.row}><Pill>{workspace.projects.length} PROJECT{workspace.projects.length === 1 ? '' : 'S'}</Pill><Text style={ui.caption}>{taskCount} open tasks</Text></View><Button label="New project" icon="plus" onPress={() => setCreating(!creating)} /></View>
    {creating && <Card><Heading small>Start a project</Heading><Field label="New project name" value={title} onChangeText={setTitle} maxLength={100} placeholder="Your next game" onSubmitEditing={addProject} /><View style={ui.wrap}><Button label="Create project" onPress={addProject} /><Button label="Cancel" tone="secondary" onPress={() => setCreating(false)} /></View></Card>}
    {!workspace.projects.length && !creating && <Card style={{ alignItems: 'center', paddingVertical: 36 }}><Icon name="folder" size={38} tint={color.green} /><Heading>A clean slate.</Heading><Body muted>Create a project or save a concept from Ideas. Your projects stay on this device.</Body><Button label="Create your first project" icon="plus" tone="secondary" onPress={() => setCreating(true)} /></Card>}
    {workspace.projects.map(p => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Open project: ${p.title}`} onPress={() => onSelect(p.id)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Card style={{ borderColor: p.id === selectedId ? color.green : color.line }}>
        <View style={ui.spread}><Pill>{p.phase}</Pill><Text style={ui.caption}>{p.genre}</Text></View>
        <View style={ui.spread}><Heading>{p.title}</Heading><Icon name="arrow-up-right" /></View>
        <Text style={ui.caption}>{p.tasks.filter(t => t.done).length}/{p.tasks.length} tasks complete · {projectProgress(p)}%</Text>
      </Card>
    </Pressable>)}
    {project && <ProjectEditor key={project.id} project={project} onChange={changeProject} onClose={() => onSelect(null)} onDelete={() => void act(() => {
      onUpdate(previous => ({ ...previous, projects: previous.projects.filter(p => p.id !== project.id) })); onSelect(null); notify('Project deleted');
    })} />}
    <ErrorMessage message={error} />
    <Card><View style={ui.row}><Icon name="hard-drive" /><Heading small>Backups & device data</Heading></View>
      <Body muted>Local saves stay here. Export a backup before reinstalling, clearing browser data, or changing phones. Backups include project notes.</Body>
      <View style={ui.wrap}>
        <Button label="Export backup" icon="download" tone="secondary" disabled={busy} onPress={() => void act(() => exportText('dev-companion-backup.json', serializeBackup(workspace)))} />
        <Button label="Import backup" icon="upload" tone="secondary" disabled={busy} onPress={() => void act(async () => { const raw = await pickBackup(); if (raw !== null) setPending(parseBackup(raw)); })} />
        <Button label="Copy backup" icon="copy" tone="quiet" disabled={busy} onPress={() => void act(async () => { await Clipboard.setStringAsync(serializeBackup(workspace)); notify('Backup copied'); })} />
      </View>
      <Button label={paste ? 'Hide backup text' : 'Restore from pasted text'} tone="quiet" onPress={() => setPaste(!paste)} />
      {paste && <><Field label="Backup JSON" multiline value={backupText} onChangeText={setBackupText} maxLength={1_000_001} autoCapitalize="none" autoCorrect={false} placeholder="Paste a Dev Companion backup" /><Button label="Validate backup" tone="secondary" onPress={() => void act(() => setPending(parseBackup(backupText)))} /></>}
      {pending && <View style={{ backgroundColor: color.pale, borderRadius: 10, padding: 16, gap: 12 }}>
        <Heading small>Replace projects on this device?</Heading><Body>This backup contains {pending.projects.length} projects. Replacing removes your current {workspace.projects.length} projects. Export them first if you need them.</Body>
        <View style={ui.wrap}><Button label="Replace projects" onPress={() => void act(() => { onUpdate(() => pending); setPending(null); onSelect(null); setBackupText(''); notify('Backup restored'); })} /><Button label="Cancel restore" tone="secondary" onPress={() => setPending(null)} /></View>
      </View>}
      <Text style={ui.caption}>No account, cloud sync, ads, or analytics. Up to 100 projects and 200 tasks per project, within a 1 MB text backup limit.</Text>
    </Card>
  </ScrollView>;
}
