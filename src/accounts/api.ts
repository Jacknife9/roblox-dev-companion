import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { readToken, saveToken, clearToken } from './tokens';
import { validateEndpoint } from './endpoint';
import { validateSnapshot } from './sync';
import type { Workspace } from '../storage/repository';
export type User = { id: string; email: string };
export class ApiError extends Error {
  constructor(public status: number, message: string, public snapshot?: unknown) { super(message); }
}
export function apiOrigin() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return validateEndpoint(configured);
  if (Platform.OS === 'web') {
    if (location.protocol === 'https:') return location.origin;
    return validateEndpoint(`http://${location.hostname}:4174`);
  }
  if (!__DEV__) throw new Error('Set EXPO_PUBLIC_API_URL to your HTTPS account service before building.');
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? '127.0.0.1';
  return validateEndpoint(`http://${host}:4174`);
}
export async function request(path: string, method = 'GET', data?: unknown): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const native = Platform.OS !== 'web';
    const token = native ? await readToken() : null;
    const response = await fetch(apiOrigin() + path, { method, signal: controller.signal, credentials: native ? 'omit' : 'include', headers: {
      'Content-Type': 'application/json', ...(native ? { 'X-Client-Type': 'native' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    const body = await response.json();
    if (!response.ok) throw new ApiError(response.status, typeof body.error === 'string' ? body.error : 'Account request failed.', response.status === 409 && body.workspace ? body : undefined);
    return body;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new Error('Account service unavailable. Check the server and your connection. Offline tools still work.');
  } finally { clearTimeout(timeout); }
}
export async function signIn(kind: 'signup' | 'login', email: string, password: string): Promise<User> {
  const body = await request(`/v1/auth/${kind}`, 'POST', { email, password });
  if (Platform.OS !== 'web') {
    if (typeof body.token !== 'string') throw new Error('Account service did not return a native session.');
    try { await saveToken(body.token); }
    catch {
      // Avoid leaving an orphaned valid session if secure device storage fails.
      await fetch(apiOrigin() + '/v1/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${body.token}`, 'X-Client-Type': 'native' }, body: '{}' }).catch(() => {});
      throw new Error('Could not securely save your session on this device.');
    }
  }
  return body.user;
}
export async function signOut() {
  try { await request('/v1/auth/logout', 'POST', {}); } catch (e) { if (!(e instanceof ApiError && e.status === 401)) throw e; }
  await clearToken().catch(() => {}); // A revoked/expired token cannot authenticate, even if device cleanup fails.
}
export async function deleteAccount(password: string) { await request('/v1/auth/delete', 'POST', { password }); await clearToken().catch(() => {}); }
export const workspaceRemote = {
  get: async () => validateSnapshot(await request('/v1/workspace')),
  put: async (workspace: Workspace, baseRevision: number) => validateSnapshot(await request('/v1/workspace', 'PUT', { workspace, baseRevision })),
};
