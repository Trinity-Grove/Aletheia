import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Liquibase-style changelog runner for data migrations that are hard
// requirements for the app to function, not optional catalog content
// (see DataMigrationLog in schema.prisma). `code` is the migration's
// stable identifier and must never change once it has shipped anywhere
// -- a DataMigrationLog row keyed by it is what makes a migration
// "already applied, never run again".
export interface DataMigration {
  code: string;
  run(): Promise<string>;
}

@Injectable()
export class DataMigrationRunner {
  private readonly logger = new Logger(DataMigrationRunner.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(migrations: DataMigration[]): Promise<void> {
    for (const migration of migrations) {
      // The changelog lookup itself can throw (e.g. the database is
      // unreachable, or this table's migration hasn't been applied yet
      // in this environment) -- that must never crash the whole boot,
      // the same as a migration's own run() failing below. Liveness
      // has to succeed independently of database health; readiness
      // reports that separately.
      try {
        const already = await this.prisma.dataMigrationLog.findUnique({
          where: { code: migration.code },
        });
        if (already) continue;

        const summary = await migration.run();
        await this.prisma.dataMigrationLog.create({
          data: { code: migration.code, notes: summary },
        });
        this.logger.log(`Data migration "${migration.code}" applied: ${summary}`);
      } catch (error) {
        // Not logged as applied -- retried on the next boot instead of
        // silently skipped. A single replica today means no
        // concurrent-boot race; revisit with a DB-level lock if that
        // ever changes.
        this.logger.error(
          `Data migration "${migration.code}" failed -- will retry on next boot.`,
          error as Error,
        );
      }
    }
  }
}
