import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PortfolioRetentionService } from '../modules/records/application/portfolio-retention.service.js';

// Standalone maintenance entry point — not wired into the running API
// process. Meant to be invoked periodically by an external scheduler
// (system cron, a scheduled CI workflow, a Kubernetes CronJob) via
// `pnpm --filter @aletheia/api run retention:purge-portfolio`, since the
// project has no in-process job scheduler yet.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const retentionService = app.get(PortfolioRetentionService);
    const purged = await retentionService.purgeExpiredSoftDeletes();
    // eslint-disable-next-line no-console
    console.log(`Purged ${purged} expired portfolio item(s).`);
  } finally {
    await app.close();
  }
}

void main();
