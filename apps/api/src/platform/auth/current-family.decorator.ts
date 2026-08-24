import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface FamilyContextPayload {
  familyId: string;
}

export const CurrentFamily = createParamDecorator(
  (data: keyof FamilyContextPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const family = request.family as FamilyContextPayload | undefined;
    if (!family) return undefined;
    return data ? family[data] : family;
  },
);
