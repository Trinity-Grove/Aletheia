import { Injectable, Logger } from '@nestjs/common';
import {
  SensitiveDataAuditRepository,
  type SensitiveDataAccessLogEntry,
} from '../infrastructure/sensitive-data-audit.repository.js';

@Injectable()
export class SensitiveDataAuditService {
  private readonly logger = new Logger(SensitiveDataAuditService.name);

  constructor(private readonly repository: SensitiveDataAuditRepository) {}

  // Swallows failures internally (unlike AccountAuditLogRepository, where
  // each caller wraps its own try/catch) -- this is called from many
  // different modules, and a single swallow point here means a future
  // call site can't forget to protect its real request flow from a
  // broken audit log.
  async record(entry: SensitiveDataAccessLogEntry): Promise<void> {
    try {
      await this.repository.record(entry);
    } catch (error) {
      this.logger.error(
        `Failed to record sensitive data access (action=${entry.action}, resourceType=${entry.resourceType}, familyId=${entry.familyId})`,
        error as Error,
      );
    }
  }
}
