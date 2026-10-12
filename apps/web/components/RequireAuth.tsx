'use client';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Navbar } from './Navbar';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !me) router.replace('/login');
  }, [loading, me, router]);
  if (loading || !me) return <p className="p-8 text-center text-zinc-500">Đang tải…</p>;
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl p-4">{children}</main>
    </>
  );
}
