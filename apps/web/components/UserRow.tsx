import Link from 'next/link';
import type { ReactNode } from 'react';
import type { UserCard } from '@/lib/api';
import { Avatar } from './Avatar';

export function UserRow({ user, children }: { user: UserCard; children?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border p-3">
      <Link href={`/profile/${user.id}`} className="flex flex-1 items-center gap-3 font-medium">
        <Avatar name={user.displayName} src={user.avatarUrl} size={44} />
        {user.displayName}
      </Link>
      {children}
    </li>
  );
}
