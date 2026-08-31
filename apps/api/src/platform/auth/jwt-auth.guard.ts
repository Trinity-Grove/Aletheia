import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IDENTITY_PUBLIC_API,
  type IdentityPublicApi,
} from '../../modules/identity/application/public-api.js';
import { SESSION_COOKIE_NAME } from './session-cookie.js';

function extractToken(request: {
  headers: Record<string, unknown>;
  cookies?: Record<string, string | undefined>;
}): string | null {
  const cookieToken = request.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers['authorization'];
  if (typeof authHeader === 'string') {
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token;
    }
  }

  return null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_PUBLIC_API)
    private readonly identityPublicApi: IdentityPublicApi,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing session cookie or Authorization header.');
    }

    const payload = await this.identityPublicApi.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    request.user = payload;
    return true;
  }
}
