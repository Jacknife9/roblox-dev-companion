import * as DocumentPicker from 'expo-document-picker';
import { MAX_BACKUP_LENGTH } from './repository';

export async function exportText(name: string, text: string, mimeType = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function pickBackup(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if (asset.size && asset.size > MAX_BACKUP_LENGTH) throw new Error('Choose a backup smaller than 1 MB.');
  if (asset.file) return asset.file.text();
  return (await fetch(asset.uri)).text();
}
