import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DataMigrationRunner } from './data-migration-runner';

@Module({
  providers: [PrismaService, DataMigrationRunner],
  exports: [PrismaService, DataMigrationRunner],
})
export class DatabaseModule {}
