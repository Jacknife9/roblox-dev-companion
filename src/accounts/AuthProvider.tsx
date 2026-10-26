import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiError, deleteAccount, request, signIn, signOut, type User } from './api';
type Auth = { user: User | null; ready: boolean; notice: string; login(kind: 'signup' | 'login', email: string, password: string): Promise<void>; logout(): Promise<void>; remove(password: string): Promise<void> };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { let active = true;
    void request('/v1/session').then(body => { if (active) setUser(body.user); }).catch(e => {
      if (active && !(e instanceof ApiError && e.status === 401)) setNotice(e instanceof Error ? e.message : 'Account service unavailable.');
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const auth: Auth = { user, ready, notice,
    async login(kind, email, password) { const next = await signIn(kind, email, password); setNotice(''); setUser(next); },
    async logout() { await signOut(); setUser(null); },
    async remove(password) { await deleteAccount(password); setUser(null); },
  };
  return <Context.Provider value={auth}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider is missing.'); return value; }
