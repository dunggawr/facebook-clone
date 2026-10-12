import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { DB, type Database } from '../infra/infra.module.js';
import { refreshTokens, users } from '../db/schema.js';
import { hashPassword, verifyPassword } from './password.js';

export const REFRESH_TTL_MS = 30 * 24 * 3600 * 1000;
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

type User = typeof users.$inferSelect;
export const toPublicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  avatarUrl: u.avatarUrl,
  coverUrl: u.coverUrl,
  bio: u.bio,
});

@Injectable()
export class AuthService {
  private readonly google = new OAuth2Client();

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string, displayName: string) {
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) throw new ConflictException('Email đã được sử dụng');
    const [user] = await this.db
      .insert(users)
      .values({ email, displayName, passwordHash: await hashPassword(password) })
      .returning();
    return this.issue(user);
  }

  async login(email: string, password: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    // Luôn tốn thời gian hash như nhau là không cần thiết ở quy mô này; trả lỗi chung.
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.issue(user);
  }

  async loginWithGoogle(credential: string) {
    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) throw new UnauthorizedException('Google login chưa được cấu hình');
    let payload;
    try {
      const ticket = await this.google.verifyIdToken({ idToken: credential, audience });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google token không hợp lệ');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Tài khoản Google chưa xác minh email');
    }
    const email = payload.email.toLowerCase();

    let [user] = await this.db.select().from(users).where(eq(users.googleId, payload.sub));
    if (!user) {
      [user] = await this.db.select().from(users).where(eq(users.email, email));
      if (user) {
        // Liên kết Google vào tài khoản email có sẵn (email Google đã được xác minh).
        [user] = await this.db
          .update(users)
          .set({ googleId: payload.sub, avatarUrl: user.avatarUrl ?? payload.picture ?? null })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        [user] = await this.db
          .insert(users)
          .values({
            email,
            googleId: payload.sub,
            displayName: payload.name ?? email.split('@')[0],
            avatarUrl: payload.picture ?? null,
          })
          .returning();
      }
    }
    return this.issue(user);
  }

  /** Xoay refresh token: token cũ bị xoá, cấp token mới. */
  async refresh(token: string | undefined) {
    if (!token) throw new UnauthorizedException();
    const [row] = await this.db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, sha256(token)), gt(refreshTokens.expiresAt, new Date())))
      .returning();
    if (!row) throw new UnauthorizedException();
    const [user] = await this.db.select().from(users).where(eq(users.id, row.userId));
    if (!user) throw new UnauthorizedException();
    return this.issue(user);
  }

  async logout(token: string | undefined) {
    if (token) await this.db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, sha256(token)));
  }

  private async issue(user: User) {
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    const refreshToken = randomBytes(32).toString('base64url');
    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return { accessToken, refreshToken, user: toPublicUser(user) };
  }
}
