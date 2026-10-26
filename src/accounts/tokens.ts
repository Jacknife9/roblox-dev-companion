import * as SecureStore from 'expo-secure-store';
const key = 'devcompanion.session.v1';
export const readToken = () => SecureStore.getItemAsync(key);
export const saveToken = (token: string) => SecureStore.setItemAsync(key, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
export const clearToken = () => SecureStore.deleteItemAsync(key);
