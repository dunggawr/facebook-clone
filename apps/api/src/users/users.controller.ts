import { Body, Controller, Get, Inject, NotFoundException, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { AuthGuard, type AuthedRequest } from '../auth/auth.guard.js';
import { toPublicUser } from '../auth/auth.service.js';
import { parse } from '../common.js';
import { users } from '../db/schema.js';
import { FriendsService } from '../friends/friends.service.js';
import { DB, type Database } from '../infra/infra.module.js';

const updateDto = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(300).nullable().optional(),
  avatarUrl: z.url().nullable().optional(),
  coverUrl: z.url().nullable().optional(),
});

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly friends: FriendsService,
  ) {}

  @Get()
  search(@Query('q') q = '') {
    const term = q.trim().replace(/[%_\\]/g, '\\$&');
    if (term.length < 2) return [];
    return this.db
      .select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl })
      .from(users)
      .where(ilike(users.displayName, `%${term}%`))
      .limit(20);
  }

  @Patch('me')
  async update(@Req() req: AuthedRequest, @Body() body: unknown) {
    const data = parse(updateDto, body);
    if (!Object.keys(data).length) return this.get(req, req.user.id);
    await this.db.update(users).set(data).where(eq(users.id, req.user.id));
    return this.get(req, req.user.id);
  }

  @Get(':id')
  async get(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const [u] = await this.db.select().from(users).where(eq(users.id, id));
    if (!u) throw new NotFoundException();
    const { email: _email, ...pub } = toPublicUser(u); // không lộ email người khác
    return { ...pub, friendStatus: await this.friends.status(req.user.id, id) };
  }
}
