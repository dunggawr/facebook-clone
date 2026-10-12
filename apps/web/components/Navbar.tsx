'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Avatar } from './Avatar';

export function Navbar() {
  const { me, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  if (!me) return null;
  return (
    <header className="sticky top-0 z-10 border-b bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mx-auto flex max-w-3xl items-center gap-3 p-3">
        <Link href="/" className="text-2xl font-bold text-blue-600">fb</Link>
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm người dùng"
            className="w-full rounded-full bg-zinc-100 px-4 py-2 text-sm outline-none dark:bg-zinc-800"
          />
        </form>
        <Link href="/friends" className="text-sm font-medium">Bạn bè</Link>
        <Link href={`/profile/${me.id}`}><Avatar name={me.displayName} src={me.avatarUrl} size={32} /></Link>
        <button
          className="text-sm text-zinc-500"
          onClick={async () => { await logout(); router.replace('/login'); }}
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
