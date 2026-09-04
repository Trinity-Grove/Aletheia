import { Injectable, Logger } from '@nestjs/common';
import { PortfolioRepository } from '../infrastructure/portfolio.repository.js';

// How long a soft-deleted portfolio item's metadata row is kept for audit
// purposes before being permanently purged. The underlying file is already
// removed from storage the moment the item is soft-deleted; this window
// only governs how long the (now file-less) database row survives.
export const PORTFOLIO_RETENTION_DAYS = 90;

@Injectable()
export class PortfolioRetentionService {
  private readonly logger = new Logger(PortfolioRetentionService.name);

  constructor(private readonly portfolioRepo: PortfolioRepository) {}

  async purgeExpiredSoftDeletes(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PORTFOLIO_RETENTION_DAYS);

    const purged = await this.portfolioRepo.purgeSoftDeletedBefore(cutoff);
    if (purged > 0) {
      this.logger.log(`Purged ${purged} portfolio item(s) soft-deleted before ${cutoff.toISOString()}.`);
    }
    return purged;
  }
}
