import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUserPayload } from '../../modules/identity/application/public-api.js';

export const CurrentUser = createParamDecorator(
  (_data: keyof AuthenticatedUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserPayload | undefined;
    if (!user) return undefined;
    return _data ? user[_data] : user;
  },
);
