import React, { useEffect, useRef, useState } from 'react';
import { Image, Linking, Platform, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { Body, Button, Card, Chips, ErrorMessage, Field, Heading, useUI } from '../components/ui';
import { listingCheck, updateLog } from '../core/toolkit';
import { parseNumber } from '../core/calculators';

export const launchTasks = [
  'Playtest a full first session on a physical phone and tablet; check touch controls and safe areas.',
  'Test keyboard/mouse and gamepad navigation, text readability and sound/settings controls.',
  'Set and verify the intended maximum players for each place in Creator Hub; load-test that server size.',
  'Run Studio server/client tests with at least two players, including respawn, disconnect and rejoin.',
  'Test DataStore load failures, retry/backoff, autosave and shutdown; never overwrite failed loads with defaults.',
  'Validate RemoteEvents on the server: types, ranges, ownership, distance and rate limits.',
  'Check gamepass/product names, icons and prices; grant purchases on the server using the right receipt flow.',
  'Check badge permissions and award conditions in a separate test game; verify awarded badges in Roblox.',
  'Preview the square game icon and 16:9 thumbnail at small sizes; confirm authentic gameplay and moderation.',
  'Write a clear title/description without keyword spam; verify supported devices, genre and content details.',
  'Complete current Creator Hub audience/content-maturity/publishing requirements and confirm public access deliberately.',
  'Check performance on a low-end phone at the target player count and profile memory/network use.',
  'Record baseline public stats, publish an honest update log and choose a follow-up measurement time.',
  'Keep a previous place version and test a rollback plan before a large update.',
];
export function PublishTools({ notify, saveChecklist }: { notify(message: string): void; saveChecklist(title: string, tasks: string[]): void }) {
  const { ui, color } = useUI();
  const [image, setImage] = useState<{ uri: string; width: number; height: number } | null>(null), [imageError, setImageError] = useState('');
  const [fit, setFit] = useState<'Center crop' | 'Fit whole image'>('Center crop'), [loadingImage, setLoadingImage] = useState(false);
  const objectUrl = useRef<string | null>(null);
  useEffect(() => () => { if (objectUrl.current && Platform.OS === 'web') URL.revokeObjectURL(objectUrl.current); }, []);
  const [title, setTitle] = useState('Build a Sky Island Tycoon'), [description, setDescription] = useState('Build your island, unlock upgrades, and explore with friends.');
  const [keywords, setKeywords] = useState('tycoon, island, build'), [listing, setListing] = useState<ReturnType<typeof listingCheck> | null>(null), [listingError, setListingError] = useState('');
  const [version, setVersion] = useState('3'), [bullets, setBullets] = useState('New sky island\nFaster mobile controls\nFixed rebirth rewards');
  const [style, setStyle] = useState<'Fire' | 'Clean'>('Fire'), [log, setLog] = useState(''), [logError, setLogError] = useState('');
  const [gameName, setGameName] = useState('My game'), [checklistError, setChecklistError] = useState('');
  async function chooseImage() {
    setLoadingImage(true); setImageError(''); let nextUrl: string | null = null;
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['image/png', 'image/jpeg', 'image/webp'], copyToCacheDirectory: true });
      if (picked.canceled) return;
      const asset = picked.assets[0]; if (!asset) return;
      if (asset.size && asset.size > 10_000_000) throw new Error('Choose an image under 10 MB.');
      const uri = Platform.OS === 'web' && asset.file ? (nextUrl = URL.createObjectURL(asset.file)) : asset.uri;
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), () => reject(new Error('This image could not be opened. Try a PNG or JPEG.'))));
      if (dimensions.width * dimensions.height > 40_000_000) throw new Error('Choose an image under 40 megapixels.');
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = nextUrl; nextUrl = null; setImage({ uri, ...dimensions });
    } catch (e) { setImageError(e instanceof Error ? e.message : 'Could not open image.'); }
    finally { if (nextUrl) URL.revokeObjectURL(nextUrl); setLoadingImage(false); }
  }
  const resizeMode = fit === 'Center crop' ? 'cover' as const : 'contain' as const;
  return <>
    <Card><Heading>Thumbnail & icon preview</Heading><Body muted>Choose a local image. It stays on this device. These are approximate discovery-card and mobile previews; Roblox layouts vary. This tool does not upload to Roblox or export a resized file.</Body>
      <Button label={loadingImage ? 'Opening image…' : 'Choose preview image'} icon="image" disabled={loadingImage} onPress={() => void chooseImage()} />
      <ErrorMessage message={imageError} />
      {image && <><Body>Source: {image.width} × {image.height} pixels</Body><Chips label="Image framing" options={['Center crop', 'Fit whole image'] as const} value={fit} onChange={setFit} />
        <Text style={ui.label}>Discovery thumbnail · 16:9</Text><Image accessibilityLabel="Discovery thumbnail preview" source={{ uri: image.uri }} resizeMode={resizeMode} style={{ width: '100%', maxWidth: 560, aspectRatio: 16 / 9, backgroundColor: color.paper, borderRadius: 10 }} />
        <View style={ui.wrap}><View style={{ gap: 8 }}><Text style={ui.label}>Mobile card · 160 × 90</Text><Image accessibilityLabel="Small mobile thumbnail preview" source={{ uri: image.uri }} resizeMode={resizeMode} style={{ width: 160, height: 90, backgroundColor: color.paper, borderRadius: 8 }} /></View>
          <View style={{ gap: 8 }}><Text style={ui.label}>Icon · 128 × 128</Text><Image accessibilityLabel="Square icon preview" source={{ uri: image.uri }} resizeMode={resizeMode} style={{ width: 128, height: 128, backgroundColor: color.paper, borderRadius: 16 }} /></View>
          <View style={{ gap: 8 }}><Text style={ui.label}>Tiny · 48 × 48</Text><Image accessibilityLabel="Tiny icon preview" source={{ uri: image.uri }} resizeMode={resizeMode} style={{ width: 48, height: 48, backgroundColor: color.paper, borderRadius: 8 }} /></View>
        </View><Body muted>{image.width < 512 || image.height < 512 ? 'This source is below 512 pixels on at least one side. ' : ''}Use a square source for game icons. Roblox recommends 16:9 thumbnails, ideally 1920 × 1080. Keep key details readable when small.</Body></>}
      <Button label="Open Roblox image guidance" icon="external-link" tone="quiet" onPress={() => void Linking.openURL('https://create.roblox.com/docs/production/publishing/thumbnails')} />
    </Card>
    <Card><Heading>Title & description helper</Heading>
      <Field label="Game title draft" value={title} onChangeText={setTitle} maxLength={300} />
      <Field label="Game description draft" value={description} onChangeText={setDescription} multiline maxLength={10_000} />
      <Field label="Relevant keywords" value={keywords} onChangeText={setKeywords} maxLength={500} hint="Comma-separated words that accurately describe this game." />
      <Button label="Check listing draft" onPress={() => { try { setListing(listingCheck(title, description, keywords.split(','))); setListingError(''); } catch (e) { setListing(null); setListingError(e instanceof Error ? e.message : 'Check draft.'); } }} />
      <ErrorMessage message={listingError} />
      {listing && <><Body>Title: {listing.titleLength} characters · Description: {listing.descriptionLength} characters</Body><Body muted>{listing.titleLength > 50 ? 'Title exceeds the 50-character planning target. ' : ''}{listing.descriptionLength > 1000 ? 'Description exceeds a 1,000-character planning budget. ' : ''}Character counts use Unicode code points; verify current field limits in Creator Hub.</Body>
        <View style={{ padding: 14, backgroundColor: color.pale, gap: 8, borderRadius: 10 }}><Text style={ui.label}>Phone approximation: {listing.phonePreview}</Text><Text style={ui.label}>Wide approximation: {listing.desktopPreview}</Text></View>
        <Body muted>Missing terms: {listing.missing.join(', ') || 'none'}. Repeated words to review: {listing.repeated.join(', ') || 'none'}. Preview cutoffs are illustrative, not Roblox rendering measurements. Relevant wording helps clarity; no ranking improvement is promised.</Body></>}
    </Card>
    <Card><Heading>Update log generator</Heading>
      <Field label="Update number" value={version} onChangeText={setVersion} keyboardType="number-pad" />
      <Chips label="Update style" options={['Fire', 'Clean'] as const} value={style} onChange={setStyle} />
      <Field label="Update bullet points" value={bullets} onChangeText={setBullets} multiline maxLength={8001} hint="One actual change per line." />
      <Button label="Generate update log" onPress={() => { try { setLog(updateLog(parseNumber(version), bullets, style)); setLogError(''); } catch (e) { setLog(''); setLogError(e instanceof Error ? e.message : 'Check update.'); } }} />
      <ErrorMessage message={logError} />
      {!!log && <><Text selectable style={ui.body}>{log}</Text><Button label="Copy update log" tone="secondary" icon="copy" onPress={() => void Clipboard.setStringAsync(log).then(() => notify('Update log copied')).catch(() => setLogError('Could not copy. Select the text instead.'))} /></>}
    </Card>
    <Card><Heading>Launch checklist</Heading><Body muted>A practical starter list. Save it to Projects to tick items off, add your own tasks and sync it with your companion account.</Body>
      <Field label="Checklist game name" value={gameName} onChangeText={setGameName} maxLength={80} />
      {launchTasks.map((task, i) => <Body key={i}>{i + 1}. {task}</Body>)}
      <Button label="Save launch checklist to Projects" icon="check-square" onPress={() => { try { if (!gameName.trim()) throw new Error('Enter a game name.'); saveChecklist(`${gameName.trim()} launch checklist`, launchTasks); setChecklistError(''); } catch (e) { setChecklistError(e instanceof Error ? e.message : 'Could not save checklist.'); } }} />
      <ErrorMessage message={checklistError} />
      <Button label="Open current publishing requirements" tone="quiet" icon="external-link" onPress={() => void Linking.openURL('https://create.roblox.com/docs/production/publishing/publish-games-and-places')} />
    </Card>
  </>;
}
