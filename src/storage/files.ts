import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { MAX_BACKUP_LENGTH } from './repository';

export async function exportText(name: string, text: string, mimeType = 'application/json') {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device. Try Copy instead.');
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Export from Dev Companion' });
}
export async function pickBackup(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if (asset.size && asset.size > MAX_BACKUP_LENGTH) throw new Error('Choose a backup smaller than 1 MB.');
  return new File(asset.uri).text();
}
