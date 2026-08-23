import { Module } from "@nestjs/common";
import { PrismaService } from "../platform/database/prisma.service.js";
import {
  degradedDependencyProbe,
  PostgresDependencyProbe,
} from "./dependency-probe.js";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: HealthService,
      useFactory: (prisma?: PrismaService) =>
        new HealthService(
          () => new Date(),
          process.env.npm_package_version ?? "0.1.0",
          new PostgresDependencyProbe(prisma),
          degradedDependencyProbe,
          degradedDependencyProbe,
        ),
      inject: [{ token: PrismaService, optional: true }],
    },
  ],
  exports: [HealthService],
})
export class HealthModule {}
