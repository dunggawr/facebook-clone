'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, post, type Me } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Session = { accessToken: string; user: Me };
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { me, loading, setSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const btn = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (!loading && me) router.replace('/');
  }, [loading, me, router]);

  const finish = useCallback(
    (s: Session) => {
      setSession(s);
      router.replace('/');
    },
    [setSession, router],
  );

  useEffect(() => {
    if (!gsiReady || !GOOGLE_CLIENT_ID || !btn.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          finish(await post<Session>('/auth/google', { credential }));
        } catch (e) {
          setError(e instanceof ApiError ? e.message : 'Đăng nhập Google thất bại');
        }
      },
    });
    window.google.accounts.id.renderButton(btn.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
  }, [gsiReady, finish]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const body = Object.fromEntries(f);
      finish(await post<Session>(mode === 'login' ? '/auth/login' : '/auth/register', body));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không kết nối được máy chủ');
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-lg border border-zinc-300 bg-transparent p-3 outline-none focus:border-blue-500';
  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-xl border p-6 shadow-sm">
      {GOOGLE_CLIENT_ID && <Script src="https://accounts.google.com/gsi/client" onReady={() => setGsiReady(true)} />}
      <h1 className="mb-4 text-center text-2xl font-bold text-blue-600">
        {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
      </h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === 'register' && <input name="displayName" required maxLength={60} placeholder="Tên hiển thị" className={input} />}
        <input name="email" type="email" required placeholder="Email" className={input} />
        <input name="password" type="password" required minLength={mode === 'register' ? 8 : 1} placeholder="Mật khẩu (tối thiểu 8 ký tự)" className={input} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-60">
          {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>
      {GOOGLE_CLIENT_ID && (
        <>
          <div className="my-4 text-center text-sm text-zinc-500">hoặc</div>
          <div ref={btn} className="flex justify-center" />
        </>
      )}
      <p className="mt-4 text-center text-sm">
        {mode === 'login' ? (
          <>Chưa có tài khoản? <Link href="/register" className="text-blue-600">Đăng ký</Link></>
        ) : (
          <>Đã có tài khoản? <Link href="/login" className="text-blue-600">Đăng nhập</Link></>
        )}
      </p>
    </div>
  );
}
