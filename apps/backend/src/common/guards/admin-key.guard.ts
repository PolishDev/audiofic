import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedKey =
      request.headers['x-admin-key'] ||
      (request.headers['authorization']?.startsWith('Bearer ')
        ? request.headers['authorization'].slice(7)
        : null);

    const expectedKey =
      process.env.ADMIN_API_KEY || 'shortstory-dev-admin-key';

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException(
        'Chave de administração inválida ou não fornecida (requer header x-admin-key)',
      );
    }

    return true;
  }
}
