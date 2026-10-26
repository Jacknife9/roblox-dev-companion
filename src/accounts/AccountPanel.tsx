import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Body, Button, Card, Chips, ErrorMessage, Field, Heading, PageTitle, useUI } from '../components/ui';
import { useAuth } from './AuthProvider';
import type { SyncEngine } from './sync';
import { createRepository, type Workspace } from '../storage/repository';
import { MAX_PROJECTS } from '../core/projects';

export function AccountPanel({ engine, close }: { engine?: SyncEngine; close(): void }) {
  const { ui } = useUI(), auth = useAuth();
  const [kind, setKind] = useState<'Sign in' | 'Create account'>('Sign in');
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false), [copying, setCopying] = useState(false);
  async function act(fn: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await fn(); } catch (e) { engine?.resume(); setError(e instanceof Error ? e.message : 'Account action failed.'); }
    finally { setBusy(false); }
  }
  async function copyGuest() {
    if (!engine) return;
    const guest = await createRepository(AsyncStorage).load();
    const existing = new Set(engine.state.workspace.projects.map(p => p.id));
    const extra = guest.projects.filter(p => !existing.has(p.id));
    engine.update((w: Workspace) => {
      if (w.projects.length + extra.length > MAX_PROJECTS) throw new Error(`This would exceed ${MAX_PROJECTS} projects. Export a backup first.`);
      return { ...w, projects: [...extra, ...w.projects] };
    });
    await engine.flush(); await engine.sync(); setCopying(false); setMessage(`${extra.length} guest projects copied. The guest originals are kept.`);
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.screen}>
    <View style={{ alignSelf: 'flex-start' }}><Button label="Close account" tone="quiet" icon="x" onPress={close} /></View>
    <PageTitle index="YOUR ACCOUNT" title={auth.user ? 'Your connected workspace.' : 'Bring your builds with you.'} subtitle="Sign in on another device to sync projects, tasks and notes." />
    <ErrorMessage message={error} />{!!message && <Body>{message}</Body>}
    {!auth.user ? <Card>
      <Heading>Optional account</Heading><Body muted>Your guest workspace works offline. An account starts with its own project list. You can copy guest projects after signing in.</Body>
      {!!auth.notice && <Body muted>{auth.notice}</Body>}
      <Chips label="Account action" options={['Sign in', 'Create account'] as const} value={kind} onChange={value => { setKind(value); setError(''); }} />
      <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={254} />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={kind === 'Create account' ? 'new-password' : 'current-password'} maxLength={128} hint="12 to 128 characters. Email recovery is not available yet." />
      <Button label={busy ? 'Connecting…' : kind} icon="log-in" disabled={busy || !auth.ready || !email.trim() || password.length < 12} onPress={() => void act(async () => { await auth.login(kind === 'Create account' ? 'signup' : 'login', email, password); setPassword(''); })} />
      <Body muted>Use an email and a new password for this companion app. Never enter your Roblox password. This does not connect to your Roblox account.</Body>
      <Body muted>The account service must be running. See the Accounts setup guide included with the source files.</Body>
    </Card> : <>
      <Card><Heading>{auth.user.email}</Heading><Body muted>{engine?.state.syncStatus}</Body>
        <Button label="Sync now" icon="refresh-cw" disabled={busy || !engine?.state.ready || engine?.state.busy} onPress={() => void act(async () => { await engine?.sync(); })} />
        <Body muted>Device copies remain available during this session without a connection. Reopening an account after closing the app requires the service. Projects sync every 30 seconds, when returning to the app, and after saved changes.</Body>
        <Body muted>Signing out returns to your guest workspace. This account’s saved device copy is kept for the next sign-in. Export a backup before switching if changes have not synced.</Body>
        <Button label="Sign out" tone="secondary" icon="log-out" disabled={busy} onPress={() => void act(async () => { await engine?.suspend(); await auth.logout(); })} />
      </Card>
      <Card><Heading small>Bring guest projects into this account</Heading><Body muted>Copy guest projects from this device. Existing projects with matching IDs are skipped; guest originals are kept.</Body>
        {copying ? <><Body>Copy these projects into the signed-in account and sync them?</Body><Button label="Confirm copy guest projects" disabled={busy || !engine?.state.ready} onPress={() => void act(copyGuest)} /><Button label="Cancel copy" tone="quiet" onPress={() => setCopying(false)} /></> : <Button label="Copy guest projects" tone="secondary" disabled={busy || !engine?.state.ready} onPress={() => setCopying(true)} />}
      </Card>
      <Card><Heading small>Delete account</Heading><Body muted>This removes your server account and synced projects. Other devices and exported backups may retain copies. There is no undo.</Body>
        {deleting ? <><Field label="Confirm account password" value={password} onChangeText={setPassword} secureTextEntry maxLength={128} autoComplete="current-password" />
          <Button label="Permanently delete account" tone="danger" disabled={busy || engine?.state.busy || password.length < 12} onPress={() => void act(async () => {
            await engine?.suspend(); const key = engine?.key; await auth.remove(password); if (key) await AsyncStorage.removeItem(key);
          })} /><Button label="Cancel account deletion" tone="quiet" onPress={() => { setDeleting(false); setPassword(''); }} /></> : <Button label="Delete my account" tone="danger" disabled={busy} onPress={() => setDeleting(true)} />}
      </Card>
    </>}
  </ScrollView>;
}
