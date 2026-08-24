import { Injectable, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      return;
    }
    try {
      await this.$connect();
    } catch {
      // Non-blocking initialization when database is temporarily unavailable
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        await this.$disconnect();
      } catch {
        // Safe teardown
      }
    }
  }
}
