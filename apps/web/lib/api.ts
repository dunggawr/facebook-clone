const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Me {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
}
export interface UserCard {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}
export type FriendStatus = 'self' | 'none' | 'friends' | 'outgoing' | 'incoming';
export interface Profile extends UserCard {
  coverUrl: string | null;
  bio: string | null;
  friendStatus: FriendStatus;
}

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function raw(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  return fetch(`${API}${path}`, { ...init, headers, credentials: 'include' });
}

let refreshing: Promise<boolean> | null = null;
/** Dùng refresh cookie để lấy access token mới (gộp các lần gọi đồng thời). */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await raw('/auth/refresh', { method: 'POST' });
      if (!res.ok) return false;
      setAccessToken((await res.json()).accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await raw(path, init);
  if (res.status === 401 && !path.startsWith('/auth/') && (await refreshSession())) {
    res = await raw(path, init);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(res.status, msg ?? 'Có lỗi xảy ra');
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const post = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
