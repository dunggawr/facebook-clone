'use client';
import { useState } from 'react';
import { api, post, type FriendStatus } from '@/lib/api';

export function FriendButton({ userId, initial }: { userId: string; initial: FriendStatus }) {
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState(false);
  if (status === 'self') return null;

  async function run(fn: () => Promise<{ status: FriendStatus }>) {
    setBusy(true);
    try {
      setStatus((await fn()).status);
    } finally {
      setBusy(false);
    }
  }
  const send = () => post<{ status: FriendStatus }>(`/friends/requests/${userId}`);
  const accept = () => post<{ status: FriendStatus }>(`/friends/requests/${userId}/accept`);
  const remove = () => api<{ status: FriendStatus }>(`/friends/${userId}`, { method: 'DELETE' });

  const base = 'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60';
  const primary = `${base} bg-blue-600 text-white`;
  const secondary = `${base} bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100`;
  return (
    <div className="flex gap-2">
      {status === 'none' && <button disabled={busy} className={primary} onClick={() => run(send)}>Thêm bạn bè</button>}
      {status === 'outgoing' && <button disabled={busy} className={secondary} onClick={() => run(remove)}>Huỷ lời mời</button>}
      {status === 'incoming' && (
        <>
          <button disabled={busy} className={primary} onClick={() => run(accept)}>Chấp nhận</button>
          <button disabled={busy} className={secondary} onClick={() => run(remove)}>Từ chối</button>
        </>
      )}
      {status === 'friends' && <button disabled={busy} className={secondary} onClick={() => run(remove)}>Huỷ kết bạn</button>}
    </div>
  );
}
