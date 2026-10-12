'use client';
import { useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { UserRow } from '@/components/UserRow';
import { api, post, type UserCard } from '@/lib/api';

function Friends() {
  const [friends, setFriends] = useState<UserCard[]>([]);
  const [requests, setRequests] = useState<UserCard[]>([]);

  const load = useCallback(async () => {
    const [f, r] = await Promise.all([api<UserCard[]>('/friends'), api<UserCard[]>('/friends/requests')]);
    setFriends(f);
    setRequests(r);
  }, []);
  useEffect(() => {
    Promise.all([api<UserCard[]>('/friends'), api<UserCard[]>('/friends/requests')]).then(([f, r]) => {
      setFriends(f);
      setRequests(r);
    });
  }, []);

  const act = async (fn: () => Promise<unknown>) => { await fn(); await load(); };
  const btn = 'rounded-lg px-3 py-1.5 text-sm font-semibold';

  return (
    <>
      <h2 className="mb-2 font-semibold">Lời mời kết bạn ({requests.length})</h2>
      <ul className="mb-6 flex flex-col gap-2">
        {requests.map((u) => (
          <UserRow key={u.id} user={u}>
            <button className={`${btn} bg-blue-600 text-white`} onClick={() => act(() => post(`/friends/requests/${u.id}/accept`))}>Chấp nhận</button>
            <button className={`${btn} bg-zinc-200 text-zinc-900`} onClick={() => act(() => api(`/friends/${u.id}`, { method: 'DELETE' }))}>Từ chối</button>
          </UserRow>
        ))}
      </ul>
      <h2 className="mb-2 font-semibold">Bạn bè ({friends.length})</h2>
      <ul className="flex flex-col gap-2">{friends.map((u) => <UserRow key={u.id} user={u} />)}</ul>
    </>
  );
}

export default function Page() {
  return <RequireAuth><Friends /></RequireAuth>;
}
