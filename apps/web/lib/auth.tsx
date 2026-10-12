'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, post, refreshSession, setAccessToken, type Me } from './api';

interface AuthState {
  me: Me | null;
  loading: boolean;
  /** Gọi sau khi login/register thành công. */
  setSession: (r: { accessToken: string; user: Me }) => void;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthState>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (await refreshSession()) setMe(await api<Me>('/auth/me').catch(() => null));
      setLoading(false);
    })();
  }, []);

  const setSession = useCallback((r: { accessToken: string; user: Me }) => {
    setAccessToken(r.accessToken);
    setMe(r.user);
  }, []);

  const logout = useCallback(async () => {
    await post('/auth/logout').catch(() => {});
    setAccessToken(null);
    setMe(null);
  }, []);

  return <Ctx.Provider value={{ me, loading, setSession, logout }}>{children}</Ctx.Provider>;
}
