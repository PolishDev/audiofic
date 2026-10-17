import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../config/auth.config.js';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    request.user = session.user;
    request.session = session.session;
    return true;
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (session) {
        request.user = session.user;
        request.session = session.session;
      }
    } catch {
      // Unauthenticated, continues as guest (deslogado first)
    }
    return true;
  }
}
