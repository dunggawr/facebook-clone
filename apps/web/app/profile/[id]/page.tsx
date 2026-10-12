'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { FriendButton } from '@/components/FriendButton';
import { RequireAuth } from '@/components/RequireAuth';
import { api, type Profile } from '@/lib/api';

function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api<Profile>(`/users/${id}`).then(setP).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p className="text-zinc-500">Không tìm thấy người dùng.</p>;
  if (!p) return <p className="text-zinc-500">Đang tải…</p>;
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600" style={p.coverUrl ? { backgroundImage: `url(${p.coverUrl})`, backgroundSize: 'cover' } : undefined} />
      <div className="flex items-end gap-4 p-4">
        <div className="-mt-12 rounded-full border-4 border-white"><Avatar name={p.displayName} src={p.avatarUrl} size={96} /></div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{p.displayName}</h1>
          {p.bio && <p className="text-sm text-zinc-500">{p.bio}</p>}
        </div>
        <FriendButton key={p.id + p.friendStatus} userId={p.id} initial={p.friendStatus} />
      </div>
    </div>
  );
}

export default function Page() {
  return <RequireAuth><ProfileView /></RequireAuth>;
}
