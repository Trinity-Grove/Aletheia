import { Module } from "@nestjs/common";
import { DatabaseModule } from "./platform/database/database.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [DatabaseModule, HealthModule],
})
export class AppModule {}
