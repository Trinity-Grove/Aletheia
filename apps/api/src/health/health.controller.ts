import type { HealthResponse, ReadinessResponse } from "@aletheia/contracts";
import { Controller, Get, Res } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { HealthService } from "./health.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("live")
  @ApiOkResponse({ description: "Process is alive" })
  live(): HealthResponse {
    return this.health.live();
  }

  @Get("ready")
  @ApiOkResponse({ description: "Process is ready or degraded" })
  @ApiServiceUnavailableResponse({ description: "Process is not ready" })
  async ready(@Res({ passthrough: true }) reply: FastifyReply): Promise<ReadinessResponse> {
    const readiness = await this.health.ready();
    if (readiness.status === "not-ready") {
      reply.status(503);
    } else {
      reply.status(200);
    }
    return readiness;
  }
}
