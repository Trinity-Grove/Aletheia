import { BadRequestException } from '@nestjs/common';
import type { DefinitionStatus } from '@aletheia/contracts';

// Same DRAFT -> PUBLISHED -> DEPRECATED -> ARCHIVED state machine as every
// other Definition/Version table (curriculum module's
// definition-status-transition.ts, issue #96 Fase 0). Duplicated here
// rather than imported cross-module -- there is no shared platform home for
// this yet, and each module in this codebase keeps its own application
// layer self-contained. If a third catalog needs this, promote it to a
// shared location under platform/.
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
