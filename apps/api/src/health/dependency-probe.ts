import type { DependencyState } from "@aletheia/contracts";
import type { PrismaService } from "../platform/database/prisma.service.js";

export interface DependencyProbe {
  check(): Promise<DependencyState>;
}

export class PostgresDependencyProbe implements DependencyProbe {
  constructor(private readonly prisma?: PrismaService) {}

  async check(): Promise<DependencyState> {
    if (!this.prisma || !process.env.DATABASE_URL) {
      return "down";
    }
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "up";
    } catch {
      return "down";
    }
  }
}

export const degradedDependencyProbe: DependencyProbe = {
  check: async () => "degraded",
};

export const unavailableDependencyProbe: DependencyProbe = {
  check: async () => "down",
};
