import type { HealthResponse, ReadinessResponse } from "@aletheia/contracts";
import { Injectable } from "@nestjs/common";
import {
  degradedDependencyProbe,
  type DependencyProbe,
  unavailableDependencyProbe,
} from "./dependency-probe.js";

@Injectable()
export class HealthService {
  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly version: string = process.env.npm_package_version ?? "0.1.0",
    private readonly postgres: DependencyProbe = unavailableDependencyProbe,
    private readonly redis: DependencyProbe = degradedDependencyProbe,
    private readonly objectStorage: DependencyProbe = degradedDependencyProbe,
  ) {}

  live(): HealthResponse {
    return {
      status: "ok",
      service: "aletheia-api",
      version: this.version,
      timestamp: this.now().toISOString(),
    };
  }

  async ready(): Promise<ReadinessResponse> {
    const [postgres, redis, objectStorage] = await Promise.all([
      this.postgres.check(),
      this.redis.check(),
      this.objectStorage.check(),
    ]);

    const status =
      postgres !== "up"
        ? "not-ready"
        : redis === "up" && objectStorage === "up"
          ? "ready"
          : "degraded";

    return {
      status,
      dependencies: { postgres, redis, objectStorage },
    };
  }
}
