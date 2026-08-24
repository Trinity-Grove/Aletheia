import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface FamilyContextPayload {
  familyId: string;
}

export const CurrentFamily = createParamDecorator(
  (_data: keyof FamilyContextPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const family = request.family as FamilyContextPayload | undefined;
    if (!family) return undefined;
    return _data ? family[_data] : family;
  },
);
