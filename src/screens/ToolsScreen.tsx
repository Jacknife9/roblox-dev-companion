import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Body, Card, Chips, PageTitle, useUI } from '../components/ui';
import { MoneyTools, RevenuePlanner, TycoonTools, UnitRoster } from './MoneyTools';
import { CodeTools } from './CodeTools';
import { PublishTools } from './PublishTools';
import { StatsTools } from './StatsTools';
export function ToolsScreen({ notify, saveChecklist }: { notify(message: string): void; saveChecklist(title: string, tasks: string[]): void }) {
  const { ui, color } = useUI(); const [tool, setTool] = useState('Money');
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.screen}>
    <PageTitle index="05 / CREATOR TOOLS" title="Build, check, launch." subtitle="Practical helpers for your next Roblox release." />
    <Card style={{ backgroundColor: color.pale }}><Body>This unofficial toolkit never asks for your Roblox password or .ROBLOSECURITY cookie. Companion sign-in is separate. The public stats tools need no account access.</Body></Card>
    <Chips label="Tool group" options={['Money', 'Tycoon', 'Code', 'Publish', 'Stats']} value={tool} onChange={setTool} />
    {tool === 'Money' && <><MoneyTools /><RevenuePlanner /></>}{tool === 'Tycoon' && <><TycoonTools /><UnitRoster /></>}{tool === 'Code' && <CodeTools notify={notify} />}{tool === 'Publish' && <PublishTools notify={notify} saveChecklist={saveChecklist} />}{tool === 'Stats' && <StatsTools />}
  </ScrollView>;
}
