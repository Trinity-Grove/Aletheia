import { BadRequestException } from '@nestjs/common';
import type { DefinitionStatus } from '@aletheia/contracts';

const ALLOWED_TRANSITIONS: Record<DefinitionStatus, DefinitionStatus[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DEPRECATED', 'ARCHIVED'],
  DEPRECATED: ['ARCHIVED'],
  ARCHIVED: [],
};

export interface DefinitionStatusUpdate {
  status: DefinitionStatus;
  publishedAt?: Date;
  deprecatedAt?: Date;
}

export function computeStatusTransition(
  current: DefinitionStatus,
  target: DefinitionStatus,
  now: Date = new Date(),
): DefinitionStatusUpdate {
  const allowedTargets = ALLOWED_TRANSITIONS[current];
  if (!allowedTargets.includes(target)) {
    const allowedDescription = allowedTargets.length > 0 ? allowedTargets.join(', ') : 'none (terminal status)';
    throw new BadRequestException(
      `Cannot transition a definition from ${current} to ${target}. Allowed from ${current}: ${allowedDescription}.`,
    );
  }

  if (target === 'PUBLISHED') {
    return { status: target, publishedAt: now };
  }
  if (target === 'DEPRECATED') {
    return { status: target, deprecatedAt: now };
  }
  return { status: target };
}
