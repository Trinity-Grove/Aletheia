import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUserPayload } from '../../modules/identity/index.js';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserPayload | undefined;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
