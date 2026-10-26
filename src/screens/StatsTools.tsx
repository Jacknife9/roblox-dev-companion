import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Body, Button, Card, Chips, ErrorMessage, Field, Heading, useUI } from '../components/ui';
import { parseGameReference, validateStatsResult, type GameStats } from '../core/robloxData';
import { request } from '../accounts/api';
import { exportText } from '../storage/files';
import { fmt } from './MoneyTools';
type StatsResult = { current: GameStats; history: GameStats[]; historyNote: string };
export function StatsTools() {
  const { ui, color } = useUI();
  const [reference, setReference] = useState(''), [kind, setKind] = useState<'Universe ID' | 'Place ID'>('Universe ID');
  const [result, setResult] = useState<StatsResult | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [metric, setMetric] = useState<'Current players' | 'Visits' | 'Favorites' | 'Like ratio'>('Current players');
  const value = (s: GameStats) => metric === 'Visits' ? s.visits : metric === 'Favorites' ? s.favorites : metric === 'Like ratio' ? (s.likeRatio ?? 0) * 100 : s.playing;
  const history = result?.history.slice(-20) ?? [], maximum = Math.max(1, ...history.map(value));
  async function refresh() {
    setBusy(true); setError('');
    try { const r = parseGameReference(reference, kind); const data = await request(`/v1/public/stats?${r.kind}=${r.id}`);
      setResult(validateStatsResult(data));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read public statistics.'); }
    finally { setBusy(false); }
  }
  async function download() {
    if (!result) return;
    try {
      const csv = ['observed_at,universe_id,visits,current_players,favorites,up_votes,down_votes,like_ratio', ...result.history.map(s => [s.fetchedAt, s.universeId, s.visits, s.playing, s.favorites, s.upVotes, s.downVotes, s.likeRatio ?? ''].join(','))].join('\n');
      await exportText(`roblox-stats-${result.current.universeId}.csv`, csv, 'text/csv');
    } catch { setError('Could not export history. Try again.'); }
  }
  const current = result?.current, first = result?.history[0];
  return <Card><Heading>Public game stats</Heading><Body muted>Visits, players, favorites and votes from Roblox’s public APIs. No Roblox login, cookie or API key is needed. Start the included service to use this tool.</Body>
    <Chips label="Numeric ID type" options={['Universe ID', 'Place ID'] as const} value={kind} onChange={setKind} />
    <Field label="Game link or ID" value={reference} onChangeText={setReference} autoCapitalize="none" autoCorrect={false} maxLength={500} placeholder="https://www.roblox.com/games/… or a numeric ID" hint="Game links resolve their place ID automatically." />
    <Button label={busy ? 'Fetching public stats…' : 'Fetch & record stats'} icon="activity" disabled={busy} onPress={() => void refresh()} />
    <ErrorMessage message={error} />
    {current && <><Heading small>{current.name}</Heading><Body>Universe {current.universeId}</Body>
      <View style={ui.wrap}>{[['Visits', fmt(current.visits)], ['Current players', fmt(current.playing)], ['Favorites', fmt(current.favorites)], ['Like ratio', current.likeRatio === null ? 'No votes' : `${fmt(current.likeRatio * 100)}%`]].map(([label, amount]) => <View key={label} style={{ flex: 1, minWidth: 120, backgroundColor: color.pale, padding: 14, borderRadius: 10, gap: 6 }}><Text style={ui.caption}>{label}</Text><Text style={ui.h3}>{amount}</Text></View>)}</View>
      <Body muted>Snapshot: {new Date(current.fetchedAt).toLocaleString()}. Last Roblox game update: {current.updatedAt ? new Date(current.updatedAt).toLocaleString() : 'not supplied'}.</Body>
      {first && result.history.length > 1 && <Body>Since first recorded snapshot: {fmt(current.visits - first.visits)} visits, {fmt(current.favorites - first.favorites)} favorites. Changes are observations, not proof an update caused them.</Body>}
      <Heading small>Recorded history</Heading><Body muted>{result.historyNote}</Body>
      <Chips label="Stats graph" options={['Current players', 'Visits', 'Favorites', 'Like ratio'] as const} value={metric} onChange={setMetric} />
      {history.length < 2 && <Body muted>One snapshot recorded. Return after a minute or after your next update to start a trend. This is not an always-running analytics collector.</Body>}
      {history.map((s, i) => <View key={s.fetchedAt} style={{ gap: 5 }}><View style={ui.spread}><Text style={ui.caption}>{new Date(s.fetchedAt).toLocaleString()}</Text><Text style={ui.label}>{metric === 'Like ratio' && s.likeRatio === null ? 'No votes' : `${fmt(value(s))}${metric === 'Like ratio' ? '%' : ''}`}</Text></View><View style={{ height: 12, borderRadius: 3, backgroundColor: color.pale }}><View style={{ height: 12, borderRadius: 3, backgroundColor: color.green, width: `${value(s) / maximum * 100}%` }} /></View>{i === history.length - 1 && <Text style={ui.caption}>Latest 20 snapshots shown · linear scale</Text>}</View>)}
      <Button label="Export stats history CSV" tone="secondary" icon="download" onPress={() => void download()} />
    </>}
  </Card>;
}
