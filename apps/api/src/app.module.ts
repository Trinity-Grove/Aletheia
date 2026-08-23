import { Module } from "@nestjs/common";
import { ConfigModule } from "./platform/config/config.module.js";
import { DatabaseModule } from "./platform/database/database.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [ConfigModule, DatabaseModule, HealthModule],
})
export class AppModule {}
