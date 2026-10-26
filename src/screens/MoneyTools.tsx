import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Body, Button, Card, Chips, ErrorMessage, Field, Heading, useUI } from '../components/ui';
import { parseNumber } from '../core/calculators';
import { priceLadder, robuxProceeds, tycoonCurve, type Tier } from '../core/toolkit';
import { DEVEX_PAGE, validateDevExRate, type DevExRate } from '../core/robloxData';
import { request } from '../accounts/api';
export const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
export function MoneyTools() {
  const { ui } = useUI();
  const [price, setPrice] = useState('100'), [share, setShare] = useState('70');
  const [product, setProduct] = useState('Gamepass'), [category, setCategory] = useState('Standard');
  const [result, setResult] = useState<{ kept: number; deducted: number; price: number; share: number } | null>(null);
  const [rate, setRate] = useState<DevExRate | null>(null), [rateError, setRateError] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [base, setBase] = useState('25'), [count, setCount] = useState('5'), [spacing, setSpacing] = useState('2');
  const [existing, setExisting] = useState('49, 99'), [tiers, setTiers] = useState<number[]>([]), [ladderError, setLadderError] = useState('');
  const [offer, setOffer] = useState('Gamepasses');
  const selectedRate = category === 'Legacy' ? rate?.legacy : category === 'Eligible US 18+' ? rate?.eligibleUS18 : rate?.standard;
  async function loadRate() {
    setBusy(true); setRateError('');
    try { setRate(validateDevExRate(await request('/v1/public/devex'))); }
    catch (e) { setRate(previous => previous ? { ...previous, stale: true } : null); setRateError(e instanceof Error ? e.message : 'Could not load the official rate.'); }
    finally { setBusy(false); }
  }
  return <>
    <Card><Heading>Robux fee & DevEx estimate</Heading>
      <Chips label="Sale type" options={['Gamepass', 'Developer product']} value={product} onChange={setProduct} />
      <Field label="Sale price in Robux" value={price} onChangeText={setPrice} keyboardType="number-pad" />
      <Field label="Creator share percent" value={share} onChangeText={setShare} keyboardType="decimal-pad" hint="70% planning assumption for your own in-game sale. Adjust for your actual arrangement." />
      <Button label="Calculate Robux kept" onPress={() => { try { const p = parseNumber(price), s = parseNumber(share); setResult({ ...robuxProceeds(p, s), price: p, share: s }); setError(''); } catch (e) { setResult(null); setError(String(e instanceof Error ? e.message : e)); } }} />
      <ErrorMessage message={error} />
      {result && <><Text style={ui.h1}>{fmt(result.kept)} Robux kept</Text><Body muted>Estimated deduction: {fmt(result.deducted)} Robux. Last calculation: {result.price} Robux at {result.share}% creator share, rounded down per sale.</Body></>}
      <View style={ui.divider} />
      <Button label={busy ? 'Checking Roblox…' : 'Load Roblox DevEx rate'} icon="refresh-cw" tone="secondary" disabled={busy} onPress={() => void loadRate()} />
      <ErrorMessage message={rateError} />
      {rate && <><Chips label="DevEx category" options={['Standard', ...(rate.eligibleUS18 ? ['Eligible US 18+'] : []), ...(rate.legacy ? ['Legacy'] : [])]} value={category} onChange={setCategory} />
        <Body>{category} rate: ${selectedRate} USD per eligible Earned Robux.</Body>
        <Body muted>{rate.stale ? 'Cached rate; latest verification failed. ' : ''}Verified {new Date(rate.fetchedAt).toLocaleString()}. The service refreshes its source cache hourly.</Body>
        {!!result && !!selectedRate && <Heading small>Rough DevEx value: ${(result.kept * selectedRate).toFixed(2)} USD</Heading>}
      </>}
      <Body muted>DevEx requires eligible Earned Robux and Roblox approval; this is not a cash balance or guaranteed payout. The US 18+ category has additional player/game requirements; legacy earnings use their historical rate. Taxes, payout fees, regional prices, licensing splits and eligibility are outside this estimate.</Body>
      <Button label="Open official DevEx terms" icon="external-link" tone="quiet" onPress={() => void Linking.openURL(DEVEX_PAGE)} />
      <Button label="Open Roblox monetization guide" icon="external-link" tone="quiet" onPress={() => void Linking.openURL('https://create.roblox.com/docs/monetize-experiences')} />
    </Card>
    <Card><Heading>Price ladder helper</Heading><Body muted>Space offers apart by at least 20% relative to the higher price. This is a design heuristic; different benefits still need clear value and playtesting.</Body>
      <Chips label="Ladder offer" options={['Gamepasses', 'Developer products']} value={offer} onChange={setOffer} />
      <Field label="First tier price" value={base} onChangeText={setBase} keyboardType="number-pad" />
      <View style={ui.wrap}><View style={{ flex: 1, minWidth: 120 }}><Field label="Number of tiers" value={count} onChangeText={setCount} keyboardType="number-pad" /></View><View style={{ flex: 1, minWidth: 120 }}><Field label="Tier multiplier" value={spacing} onChangeText={setSpacing} keyboardType="decimal-pad" /></View></View>
      <Field label="Existing offer prices" value={existing} onChangeText={setExisting} hint="Comma-separated whole Robux prices, or leave blank." />
      <Button label="Suggest price ladder" onPress={() => { try { setTiers(priceLadder(parseNumber(base), parseNumber(count), parseNumber(spacing), existing.trim() ? existing.split(/[,\s]+/).filter(Boolean).map(Number) : [])); setLadderError(''); } catch (e) { setTiers([]); setLadderError(e instanceof Error ? e.message : 'Check prices.'); } }} />
      <ErrorMessage message={ladderError} />
      {!!tiers.length && <View style={{ gap: 8 }}>{tiers.map((n, i) => <Body key={i}>{offer === 'Gamepasses' ? 'Pass' : 'Product'} tier {i + 1}: {fmt(n)} Robux</Body>)}<Body muted>Put both pass and product prices in Existing offer prices to avoid nearby suggestions across the two sets. Permanent and repeatable offers need distinct benefits.</Body></View>}
    </Card>
  </>;
}

export function TycoonTools() {
  const { color, ui } = useUI();
  const [income, setIncome] = useState('10'), [costs, setCosts] = useState('100, 300, 900, 2700, 8100');
  const [growth, setGrowth] = useState('2'), [multiplier, setMultiplier] = useState('2'), [rebirths, setRebirths] = useState('0');
  const [loss, setLoss] = useState('0'), [min, setMin] = useState('5'), [max, setMax] = useState('120');
  const [mode, setMode] = useState('Cumulative time'), [rows, setRows] = useState<Tier[]>([]), [error, setError] = useState('');
  const values = rows.map(r => mode === 'Cumulative time' ? r.totalSeconds : r.seconds), largest = Math.max(1, ...values);
  return <Card><Heading>Tycoon & steal-game progression</Heading>
    <Field label="Income per second" value={income} onChangeText={setIncome} keyboardType="decimal-pad" />
    <Field label="Upgrade costs" value={costs} onChangeText={setCosts} hint="Comma-separated sequential purchase costs, up to 50 tiers." />
    <Field label="Income multiplier per upgrade" value={growth} onChangeText={setGrowth} keyboardType="decimal-pad" hint="Applied after buying each upgrade." />
    <View style={ui.wrap}><View style={{ flex: 1, minWidth: 120 }}><Field label="Rebirth multiplier" value={multiplier} onChangeText={setMultiplier} keyboardType="decimal-pad" /></View><View style={{ flex: 1, minWidth: 120 }}><Field label="Completed rebirths" value={rebirths} onChangeText={setRebirths} keyboardType="number-pad" /></View></View>
    <Field label="Average income lost to steals percent" value={loss} onChangeText={setLoss} keyboardType="decimal-pad" hint="0–99. A fixed average loss assumption, not a theft simulation." />
    <View style={ui.wrap}><View style={{ flex: 1, minWidth: 120 }}><Field label="Minimum target wait seconds" value={min} onChangeText={setMin} keyboardType="decimal-pad" /></View><View style={{ flex: 1, minWidth: 120 }}><Field label="Maximum target wait seconds" value={max} onChangeText={setMax} keyboardType="decimal-pad" /></View></View>
    <Button label="Graph progression" icon="bar-chart-2" onPress={() => { try { const l = parseNumber(loss); if (l < 0 || l > 99) throw new Error('Average loss must be 0 to 99 percent.'); setRows(tycoonCurve(parseNumber(income) * (1 - l / 100), costs.split(/[,\s]+/).filter(Boolean).map(Number), parseNumber(growth), parseNumber(multiplier), parseNumber(rebirths), parseNumber(min), parseNumber(max))); setError(''); } catch (e) { setRows([]); setError(e instanceof Error ? e.message : 'Check the model.'); } }} />
    <ErrorMessage message={error} />
    {!!rows.length && <><Chips label="Graph view" options={['Cumulative time', 'Wait per tier']} value={mode} onChange={setMode} />
      <Body muted>{mode}, linear scale in seconds. Last calculated assumptions; recalculate after editing.</Body>
      {rows.map((r, i) => <View key={r.tier} style={{ gap: 6 }}><View style={ui.spread}><Text style={ui.label}>Tier {r.tier} · {r.flag}</Text><Text style={ui.caption}>{fmt(values[i]!)} seconds</Text></View><View accessibilityLabel={`Tier ${r.tier}: ${fmt(values[i]!)} seconds, ${r.flag}`} style={{ height: 16, backgroundColor: color.pale, borderRadius: 4 }}><View style={{ height: 16, width: `${Math.max(.5, values[i]! / largest * 100)}%`, backgroundColor: r.flag === 'Grindy' ? color.error : color.green, borderRadius: 4 }} /></View><Text style={ui.caption}>Cost {fmt(r.cost)} · income {fmt(r.income)}/sec · wait {fmt(r.seconds)} sec</Text></View>)}
    </>}
    <Body muted>Assumes zero savings, sequential purchases that spend each listed cost, constant income between upgrades, no travel/idle time, and the selected permanent rebirth boost. Rebirth cost and reset downtime are excluded. Fast/grindy labels use your target waits; playtests decide what feels right.</Body>
  </Card>;
}
