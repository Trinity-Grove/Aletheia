import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { DatabaseRestoreService } from '../modules/backup/database-restore.service.js';

// CLI entry point for disaster recovery:
// Usage: node dist/scripts/restore-database.js [optional-specific-s3-key] [--target-url <url>]
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let specificKey: string | undefined;
  let targetUrl: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target-url' && args[i + 1]) {
      targetUrl = args[i + 1];
      i++;
    } else if (!args[i]?.startsWith('--') && !specificKey) {
      specificKey = args[i];
    }
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const restoreService = app.get(DatabaseRestoreService);
    // eslint-disable-next-line no-console
    console.log(
      `Starting database restoration... (target: ${targetUrl ? 'custom URL' : 'DATABASE_URL'})`,
    );
    const result = await restoreService.restoreFromBackup(specificKey, targetUrl);
    // eslint-disable-next-line no-console
    console.log(
      `Restoration completed successfully in ${result.durationMs}ms from backup key: ${result.key}`,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database restoration failed:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main();
