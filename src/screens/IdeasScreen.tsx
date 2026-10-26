import React, { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { GENRES, TEAMS, SCOPES, generateIdea, type Genre, type Team, type Scope, type Idea } from '../core/ideas';
import { Button, Card, Body, Chips, Heading, Icon, PageTitle, Pill, color, ui } from '../components/ui';

export function IdeasScreen({ onSave }: { onSave: (idea: Idea) => void }) {
  const [genre, setGenre] = useState<Genre>('Simulator');
  const [team, setTeam] = useState<Team>('Solo');
  const [scope, setScope] = useState<Scope>('Weekend');
  const [seed, setSeed] = useState(0);
  const [idea, setIdea] = useState(() => generateIdea('Simulator', 'Solo', 'Weekend', 0));
  const wide = useWindowDimensions().width >= 1100;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.screen}>
    <PageTitle index="01 / CONCEPT STUDIO" title="Make something worth playing." subtitle="Turn a spark into a small, buildable game idea." />
    <View style={{ padding: 24, borderRadius: 16, backgroundColor: color.pale, gap: 12 }}>
      <View style={ui.row}><Icon name="zap" tint={color.green} /><Text style={ui.eyebrow}>LESS SCOPE. MORE PLAY.</Text></View>
      <Heading>A great loop comes first.</Heading>
      <Body muted>Pick your constraints. Find a hook. Build the smallest version that feels fun.</Body>
    </View>
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 20, alignItems: 'stretch' }}>
      <Card style={{ flex: wide ? 0.85 : undefined, alignSelf: wide ? 'flex-start' : undefined }}>
        <Heading small>Your brief</Heading>
        <Chips label="Game genre" options={GENRES} value={genre} onChange={setGenre} />
        <Chips label="Team size" options={TEAMS} value={team} onChange={setTeam} />
        <Chips label="Build window" options={SCOPES} value={scope} onChange={setScope} />
        <Button label="Generate idea" icon="shuffle" onPress={() => {
          const next = seed + 1; setSeed(next); setIdea(generateIdea(genre, team, scope, next));
        }} />
        <Text style={ui.caption}>Curated combinations, generated on your device. No AI service or internet needed.</Text>
      </Card>
      <Card style={{ flex: wide ? 1.25 : undefined, borderTopColor: color.green, borderTopWidth: 4 }}>
        <View style={ui.spread}><Pill>{idea.genre.toUpperCase()}</Pill><Text style={ui.caption}>{idea.team} · {idea.scope}</Text></View>
        <Text accessibilityRole="header" style={[ui.h1, { fontSize: 28 }]}>{idea.title}</Text>
        <View style={{ gap: 8 }}><Text style={ui.eyebrow}>THE CORE LOOP</Text><Body>{idea.loop}</Body></View>
        <View style={ui.divider} />
        <View style={{ gap: 8 }}><Heading small>A reason to come back</Heading><Body muted>{idea.progression}</Body></View>
        <View style={{ gap: 8 }}><Heading small>The twist</Heading><Body muted>{idea.hook}</Body></View>
        <View style={{ padding: 16, backgroundColor: color.paper, borderRadius: 10, gap: 8 }}>
          <View style={ui.row}><Icon name="scissors" size={16} /><Text style={ui.label}>Keep it buildable</Text></View><Body muted>{idea.scopeNote}</Body>
        </View>
        <Button label="Start a project from this idea" icon="plus" onPress={() => onSave(idea)} />
        <Text style={ui.caption}>Includes four starter tasks. You can edit everything.</Text>
      </Card>
    </View>
  </ScrollView>;
}
