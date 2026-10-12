'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { UserRow } from '@/components/UserRow';
import { api, type UserCard } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function Home() {
  const { me } = useAuth();
  const q = useSearchParams().get('q') ?? '';
  const [found, setFound] = useState<{ q: string; users: UserCard[] } | null>(null);
  const results = found?.q === q && q.trim().length >= 2 ? found.users : null;

  useEffect(() => {
    if (q.trim().length < 2) return;
    api<UserCard[]>(`/users?q=${encodeURIComponent(q)}`)
      .then((users) => setFound({ q, users }))
      .catch(() => setFound({ q, users: [] }));
  }, [q]);

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Xin chào, {me?.displayName}</h1>
      {results ? (
        <>
          <h2 className="mb-2 text-sm text-zinc-500">Kết quả cho “{q}”</h2>
          {results.length ? (
            <ul className="flex flex-col gap-2">{results.map((u) => <UserRow key={u.id} user={u} />)}</ul>
          ) : (
            <p className="text-zinc-500">Không tìm thấy ai.</p>
          )}
        </>
      ) : (
        <p className="text-zinc-500">Bảng tin sẽ có ở giai đoạn sau. Hãy tìm bạn bè ở ô tìm kiếm phía trên.</p>
      )}
    </>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <Suspense>
        <Home />
      </Suspense>
    </RequireAuth>
  );
}
