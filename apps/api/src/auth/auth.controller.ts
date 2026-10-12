import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { Inject } from '@nestjs/common';
import { z } from 'zod';
import { parse } from '../common.js';
import { DB, type Database } from '../infra/infra.module.js';
import { users } from '../db/schema.js';
import { AuthGuard, type AuthedRequest } from './auth.guard.js';
import { AuthService, REFRESH_TTL_MS, toPublicUser } from './auth.service.js';

const COOKIE = 'refresh_token';
const prod = () => process.env.NODE_ENV === 'production';

const registerDto = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(60),
});
const loginDto = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(128),
});
const googleDto = z.object({ credential: z.string().min(1) });

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(DB) private readonly db: Database,
  ) {}

  private respond(
    res: FastifyReply,
    r: { accessToken: string; refreshToken: string; user: unknown },
  ) {
    // Web ở Vercel, API ở domain khác => cần SameSite=None; Secure khi production.
    res.setCookie(COOKIE, r.refreshToken, {
      httpOnly: true,
      secure: prod(),
      sameSite: prod() ? 'none' : 'lax',
      path: '/auth',
      maxAge: REFRESH_TTL_MS / 1000,
    });
    return { accessToken: r.accessToken, user: r.user };
  }

  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: FastifyReply) {
    const d = parse(registerDto, body);
    return this.respond(res, await this.auth.register(d.email, d.password, d.displayName));
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: FastifyReply) {
    const d = parse(loginDto, body);
    return this.respond(res, await this.auth.login(d.email, d.password));
  }

  @Post('google')
  @HttpCode(200)
  async google(@Body() body: unknown, @Res({ passthrough: true }) res: FastifyReply) {
    const d = parse(googleDto, body);
    return this.respond(res, await this.auth.loginWithGoogle(d.credential));
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    return this.respond(res, await this.auth.refresh(req.cookies[COOKIE]));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    await this.auth.logout(req.cookies[COOKIE]);
    res.clearCookie(COOKIE, { path: '/auth' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: AuthedRequest) {
    const [user] = await this.db.select().from(users).where(eq(users.id, req.user.id));
    return toPublicUser(user);
  }
}
