import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  FAMILY_PUBLIC_API,
  type FamilyPublicApi,
} from '../../application/public-api.js';

@Injectable()
export class FamilyTenantGuard implements CanActivate {
  constructor(
    @Inject(FAMILY_PUBLIC_API)
    private readonly familyPublicApi: FamilyPublicApi,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication required for tenant operations.');
    }

    const familyId =
      request.params?.familyId ||
      request.params?.id ||
      request.headers?.['x-family-id'] ||
      request.body?.familyId;

    if (!familyId || typeof familyId !== 'string') {
      throw new ForbiddenException('Family tenancy scope is required.');
    }

    const isMember = await this.familyPublicApi.isGuardianInFamily(user.userId, familyId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this family tenancy.');
    }

    request.family = { familyId };
    return true;
  }
}
