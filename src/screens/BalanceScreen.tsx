import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { xpCurve, upgradeCurve, economyBalance, parseNumber } from '../core/calculators';
import { Body, Button, Card, Chips, ErrorMessage, Field, Heading, PageTitle, useUI } from '../components/ui';

const modes = ['XP curve', 'Upgrade costs', 'Economy'] as const;
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
type Row = { label: string; amount: number; total: number; minutes?: number };
export function BalanceScreen() {
  const { color, ui } = useUI();
  const [mode, setMode] = useState<typeof modes[number]>('XP curve');
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.screen}>
    <PageTitle index="02 / GAME BALANCE" title="Make the numbers feel right." subtitle="Model the grind before your players have to live it." />
    <Chips label="Calculator" options={modes} value={mode} onChange={setMode} />
    {mode === 'Economy' ? <Economy /> : <Curve key={mode} upgrade={mode === 'Upgrade costs'} />}
    <Card style={{ backgroundColor: color.pale }}><Heading small>Design for a good session</Heading><Body muted>Start with a reward in the first minute. Playtest the time between meaningful choices. A balanced spreadsheet still needs real players.</Body></Card>
  </ScrollView>;
}
function Curve({ upgrade }: { upgrade: boolean }) {
  const { color, ui } = useUI();
  const [base, setBase] = useState(upgrade ? '50' : '100');
  const [growth, setGrowth] = useState('1.25');
  const [count, setCount] = useState('10');
  const [income, setIncome] = useState('25');
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [assumptions, setAssumptions] = useState('');
  const calculate = () => {
    try {
      const b = parseNumber(base), g = parseNumber(growth), c = parseNumber(count);
      const result = upgrade
        ? upgradeCurve(b, g, c, parseNumber(income)).map(r => ({ label: `#${r.upgrade}`, amount: r.cost, total: r.total, minutes: r.minutes }))
        : xpCurve(b, g, c).map(r => ({ label: `${r.level}`, amount: r.required, total: r.total }));
      setRows(result); setShowAll(false); setError('');
      setAssumptions(`Base ${fmt(b)} · growth ${g}× · ${upgrade ? `${c} purchases · ${income} coins/min` : `target level ${c}`}`);
    } catch (e) { setRows([]); setError(e instanceof Error ? e.message : 'Check your inputs.'); }
  };
  const last = rows.at(-1);
  return <>
    <Card>
      <Heading>{upgrade ? 'Upgrade cost model' : 'Level progression'}</Heading>
      <View style={ui.wrap}>
        <View style={{ flex: 1, minWidth: 120 }}><Field label={upgrade ? 'First cost' : 'Base XP'} value={base} onChangeText={setBase} keyboardType="decimal-pad" hint="1 to 1,000,000,000" /></View>
        <View style={{ flex: 1, minWidth: 120 }}><Field label="Growth multiplier" value={growth} onChangeText={setGrowth} keyboardType="decimal-pad" hint="1 to 3 (1 = flat)" /></View>
        <View style={{ flex: 1, minWidth: 120 }}><Field label={upgrade ? 'Purchases' : 'Target level'} value={count} onChangeText={setCount} keyboardType="number-pad" hint={upgrade ? '1 to 100' : '2 to 200'} /></View>
      </View>
      {upgrade && <Field label="Coins per minute" value={income} onChangeText={setIncome} keyboardType="decimal-pad" hint="Constant income, starting from zero coins" />}
      <Button label="Calculate curve" icon="activity" onPress={calculate} />
      <ErrorMessage message={error} />
      <Text style={ui.caption}>{upgrade ? 'Cost(n) = round(first cost × growth^(n−1)). Time = cumulative cost ÷ income.' : 'XP to reach level L = round(base × growth^(L−2)). Level 1 starts at zero.'} Each step rounds before totals are added.</Text>
    </Card>
    {last ? <Card>
      <Text style={ui.eyebrow}>YOUR LAST CALCULATION</Text>
      <Text style={[ui.h1, { color: color.green }]}>{fmt(last.total)} {upgrade ? 'coins' : 'XP'}</Text>
      <Body muted>{upgrade ? `Across all purchases. ${fmt(last.minutes!)} minutes at your fixed earning rate.` : `Total XP from level 1 to level ${last.label}.`}</Body>
      <Text style={ui.caption}>{assumptions}. Calculate again after editing inputs.</Text>
      <View style={ui.divider} />
      <View style={ui.row}><Text style={[ui.label, { flex: 0.6 }]}>{upgrade ? 'Buy' : 'Level'}</Text><Text style={[ui.label, { flex: 1, textAlign: 'right' }]}>{upgrade ? 'Cost' : 'Step XP'}</Text><Text style={[ui.label, { flex: 1, textAlign: 'right' }]}>Total</Text></View>
      {(showAll ? rows : rows.slice(0, 12)).map((row, index) => <View key={row.label} style={{ gap: 8 }}>
        <View style={ui.row}><Text style={[ui.body, { flex: 0.6 }]}>{row.label}</Text><Text style={[ui.body, { flex: 1, textAlign: 'right' }]}>{fmt(row.amount)}</Text><Text style={[ui.body, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>{fmt(row.total)}</Text></View>
        {index < 6 && <View accessible={false} style={{ height: 4, borderRadius: 2, backgroundColor: color.paper }}><View style={{ height: 4, borderRadius: 2, backgroundColor: color.green, width: `${Math.max(2, row.amount / rows[Math.min(5, rows.length - 1)]!.amount * 100)}%` }} /></View>}
      </View>)}
      {rows.length > 12 && <Button label={showAll ? 'Show first 12 rows' : `Show all ${rows.length} rows`} tone="secondary" onPress={() => setShowAll(!showAll)} />}
    </Card> : !error && <Body muted>Enter your assumptions and calculate to see every step.</Body>}
  </>;
}
function Economy() {
  const { color, ui } = useUI();
  const [earned, setEarned] = useState('20');
  const [spent, setSpent] = useState('12');
  const [duration, setDuration] = useState('30');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReturnType<typeof economyBalance> | null>(null);
  return <>
    <Card><Heading>Faucets & sinks</Heading><Body muted>Use average rates per player. Include repeatable rewards and recurring spending.</Body>
      <Field label="Coins earned per minute" value={earned} onChangeText={setEarned} keyboardType="decimal-pad" />
      <Field label="Coins spent per minute" value={spent} onChangeText={setSpent} keyboardType="decimal-pad" />
      <Field label="Session minutes" value={duration} onChangeText={setDuration} keyboardType="decimal-pad" hint="0.1 to 1,440 minutes" />
      <Button label="Calculate balance" icon="sliders" onPress={() => {
        try { setResult(economyBalance(parseNumber(earned), parseNumber(spent), parseNumber(duration))); setError(''); }
        catch (e) { setResult(null); setError(e instanceof Error ? e.message : 'Check your inputs.'); }
      }} /><ErrorMessage message={error} />
    </Card>
    {result && <Card><Text style={ui.eyebrow}>NET COINS / SESSION</Text><Text style={ui.h1}>{result.net > 0 ? '+' : ''}{fmt(result.net)}</Text>
      <Body>Earned {fmt(result.earned)} · Spent {fmt(result.spent)}</Body>
      <Body muted>{result.net > 0 ? 'Coins accumulate. Decide what players will save for and when.' : result.net < 0 ? 'Spending exceeds income. Starting savings are needed to sustain this rate.' : 'The average inflow and outflow match under these assumptions.'}</Body>
      <Text style={ui.caption}>Sink / faucet ratio: {result.sinkRatio === null ? 'undefined (no income)' : `${fmt(result.sinkRatio * 100)}%`}. Last calculation; calculate again after edits. Rates are assumed constant; no Robux conversion or earnings prediction.</Text>
    </Card>}
  </>;
}
