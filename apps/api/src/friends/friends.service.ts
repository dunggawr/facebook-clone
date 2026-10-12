import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, or } from 'drizzle-orm';
import { DB, type Database } from '../infra/infra.module.js';
import { friendships, users } from '../db/schema.js';

export type FriendStatus = 'self' | 'none' | 'friends' | 'outgoing' | 'incoming';

const card = {
  id: users.id,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl,
};

@Injectable()
export class FriendsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async between(a: string, b: string) {
    const [row] = await this.db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
          and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
        ),
      );
    return row;
  }

  async status(me: string, other: string): Promise<FriendStatus> {
    if (me === other) return 'self';
    const row = await this.between(me, other);
    if (!row) return 'none';
    if (row.status === 'accepted') return 'friends';
    return row.requesterId === me ? 'outgoing' : 'incoming';
  }

  async sendRequest(me: string, target: string) {
    if (me === target) throw new BadRequestException('Không thể kết bạn với chính mình');
    const [t] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, target));
    if (!t) throw new NotFoundException('Người dùng không tồn tại');
    const existing = await this.between(me, target);
    if (existing) {
      // Đối phương đã gửi lời mời cho mình -> chấp nhận luôn.
      if (existing.status === 'pending' && existing.addresseeId === me) return this.accept(me, target);
      throw new ConflictException('Đã gửi lời mời hoặc đã là bạn bè');
    }
    await this.db.insert(friendships).values({ requesterId: me, addresseeId: target });
    return { status: 'outgoing' as const };
  }

  async accept(me: string, requesterId: string) {
    const res = await this.db
      .update(friendships)
      .set({ status: 'accepted' })
      .where(
        and(
          eq(friendships.requesterId, requesterId),
          eq(friendships.addresseeId, me),
          eq(friendships.status, 'pending'),
        ),
      )
      .returning();
    if (!res.length) throw new NotFoundException('Không có lời mời');
    return { status: 'friends' as const };
  }

  /** Huỷ kết bạn / từ chối / thu hồi lời mời. */
  async remove(me: string, other: string) {
    await this.db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, me), eq(friendships.addresseeId, other)),
          and(eq(friendships.requesterId, other), eq(friendships.addresseeId, me)),
        ),
      );
    return { status: 'none' as const };
  }

  async list(me: string) {
    const asRequester = await this.db
      .select(card)
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.addresseeId))
      .where(and(eq(friendships.requesterId, me), eq(friendships.status, 'accepted')));
    const asAddressee = await this.db
      .select(card)
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.requesterId))
      .where(and(eq(friendships.addresseeId, me), eq(friendships.status, 'accepted')));
    return [...asRequester, ...asAddressee].sort((x, y) => x.displayName.localeCompare(y.displayName));
  }

  incoming(me: string) {
    return this.db
      .select(card)
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.requesterId))
      .where(and(eq(friendships.addresseeId, me), eq(friendships.status, 'pending')))
      .orderBy(desc(friendships.createdAt))
      .limit(100);
  }
}
