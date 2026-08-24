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
} from '../../application/public-api.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_PUBLIC_API)
    private readonly identityPublicApi: IdentityPublicApi,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Expected Bearer token format.');
    }

    const payload = await this.identityPublicApi.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    request.user = payload;
    return true;
  }
}
