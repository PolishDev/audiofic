import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { and, eq, gt } from 'drizzle-orm';
import { auth } from '../../config/auth.config.js';
import { DRIZZLE, type Database } from '../../db/index.js';
import { session as sessionTable } from '../../db/schemas/session.table.js';

function extractTokenFromRequest(request: any): string | null {
  const authHeader = request.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const raw = authHeader.slice(7).trim();
    if (raw) return raw.split('.')[0];
  }

  const cookieHeader = request.headers?.cookie;
  if (typeof cookieHeader === 'string') {
    // 1. Standard cookie pattern: better-auth.session_token=...
    const match = cookieHeader.match(
      /(?:better-auth\.session_token|__Secure-better-auth\.session_token)=([^;]+)/,
    );
    if (match && match[1]) {
      return decodeURIComponent(match[1]).split('.')[0];
    }

    // 2. Fallback: raw JSON string in cookie
    try {
      const parsed = JSON.parse(cookieHeader);
      const val =
        parsed['better-auth.session_token']?.value ??
        parsed['__Secure-better-auth.session_token']?.value ??
        parsed['better-auth.session_token'];
      if (typeof val === 'string') {
        return val.split('.')[0];
      }
    } catch {
      // Not JSON
    }
  }

  return null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Better Auth official session resolution
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (session) {
        request.user = session.user;
        request.session = session.session;
        return true;
      }
    } catch {
      // Fall through to database lookup
    }

    // 2. Direct database lookup fallback (handles Bearer tokens and mobile storage cookies)
    const token = extractTokenFromRequest(request);
    if (token) {
      const dbSession = await this.db.query.session.findFirst({
        where: and(
          eq(sessionTable.token, token),
          gt(sessionTable.expiresAt, new Date()),
        ),
        with: {
          user: true,
        },
      });

      if (dbSession && dbSession.user) {
        request.user = dbSession.user;
        request.session = dbSession;
        return true;
      }
    }

    throw new UnauthorizedException('Sessão inválida ou expirada');
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Better Auth official session resolution
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (session) {
        request.user = session.user;
        request.session = session.session;
        return true;
      }
    } catch {
      // Fall through to database lookup
    }

    // 2. Direct database lookup fallback
    const token = extractTokenFromRequest(request);
    if (token) {
      try {
        const dbSession = await this.db.query.session.findFirst({
          where: and(
            eq(sessionTable.token, token),
            gt(sessionTable.expiresAt, new Date()),
          ),
          with: {
            user: true,
          },
        });

        if (dbSession && dbSession.user) {
          request.user = dbSession.user;
          request.session = dbSession;
        }
      } catch {
        // Continue as guest
      }
    }

    return true;
  }
}
