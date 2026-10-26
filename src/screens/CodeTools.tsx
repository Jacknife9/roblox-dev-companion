import React, { useState } from 'react';
import { Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Body, Button, Card, ErrorMessage, Field, Heading, useUI } from '../components/ui';
import { parseNumber } from '../core/calculators';
import { offsetToScale } from '../core/toolkit';
import { checkScript, type Finding } from '../core/scriptCheck';

export function CodeTools({ notify }: { notify(message: string): void }) {
  const { ui, color } = useUI();
  const [x, setX] = useState('200'), [y, setY] = useState('100'), [width, setWidth] = useState('800'), [height, setHeight] = useState('600');
  const [converted, setConverted] = useState(''), [error, setError] = useState('');
  const [source, setSource] = useState(''), [findings, setFindings] = useState<Finding[] | null>(null), [checkError, setCheckError] = useState('');
  return <>
    <Card><Heading>Offset → Scale converter</Heading>
      <View style={ui.wrap}><View style={{ flex: 1, minWidth: 120 }}><Field label="X offset pixels" value={x} onChangeText={setX} keyboardType="numbers-and-punctuation" /></View><View style={{ flex: 1, minWidth: 120 }}><Field label="Y offset pixels" value={y} onChangeText={setY} keyboardType="numbers-and-punctuation" /></View></View>
      <View style={ui.wrap}><View style={{ flex: 1, minWidth: 120 }}><Field label="Parent width pixels" value={width} onChangeText={setWidth} keyboardType="decimal-pad" /></View><View style={{ flex: 1, minWidth: 120 }}><Field label="Parent height pixels" value={height} onChangeText={setHeight} keyboardType="decimal-pad" /></View></View>
      <Button label="Convert to Scale" onPress={() => { try { const value = offsetToScale(parseNumber(x), parseNumber(y), parseNumber(width), parseNumber(height)); setConverted(`UDim2.fromScale(${Number(value.x.toFixed(6))}, ${Number(value.y.toFixed(6))})`); setError(''); } catch (e) { setConverted(''); setError(e instanceof Error ? e.message : 'Check dimensions.'); } }} />
      <ErrorMessage message={error} />
      {!!converted && <><Text selectable style={[ui.code, { backgroundColor: color.codeSurface, padding: 12 }]}>{converted}</Text><Button label="Copy Scale value" tone="secondary" onPress={() => void Clipboard.setStringAsync(converted).then(() => notify('Scale value copied')).catch(() => setError('Could not copy. Select the text instead.'))} /></>}
      <Body muted>Converts a zero-Scale Offset size or position using the parent’s current AbsoluteSize. For mixed UDim2 values, add these results to the existing Scale. Test phone/tablet sizes and AnchorPoint; use layout constraints where needed. One conversion does not make an entire interface responsive.</Body>
    </Card>
    <Card><Heading>Common-mistake checker</Heading><Body muted>Local pattern checks only. Your pasted code is not uploaded or executed. It can miss bugs and flag safe code, including DataStore wrapper functions. Findings are review prompts, not a security audit.</Body>
      <Field label="Luau script to check" value={source} onChangeText={setSource} multiline maxLength={100_001} autoCapitalize="none" autoCorrect={false} style={{ minHeight: 190, fontFamily: 'monospace' }} placeholder="Paste Luau source here" />
      <Button label="Check script" icon="check-square" onPress={() => { try { setFindings(checkScript(source)); setCheckError(''); } catch (e) { setFindings(null); setCheckError(e instanceof Error ? e.message : 'Could not check source.'); } }} />
      <ErrorMessage message={checkError} />
      {findings && <><Heading small>{findings.length} review prompts</Heading>{!findings.length && <Body>No covered patterns found. This does not prove the script is safe or correct.</Body>}{findings.map((f, i) => <View key={i} style={{ gap: 5, borderLeftWidth: 3, borderColor: color.green, paddingLeft: 12 }}><Text style={ui.label}>Line {f.line} · {f.rule}</Text><Body muted>{f.message}</Body></View>)}</>}
      <Body muted>The Scripts tab includes DataStore retries, leaderstats, prompts, tweens, a validated RemoteEvent shop and a shared round timer, with placement and limitations for each.</Body>
    </Card>
  </>;
}
