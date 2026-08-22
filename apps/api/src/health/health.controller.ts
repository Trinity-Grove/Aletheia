import { Controller, Get, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { HealthResponse, ReadinessResponse } from '@aletheia/contracts';
import type { FastifyReply } from 'fastify';
import { HealthResponseDto } from './health-response.dto';
import { HealthService } from './health.service';
import { ReadinessResponseDto } from './readiness-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly health: HealthService;

  constructor(health: HealthService) {
    this.health = health;
  }

  @Get('live')
  @ApiOkResponse({
    description: 'Process is alive',
    type: HealthResponseDto,
  })
  live(): HealthResponse {
    return this.health.live();
  }

  @Get('ready')
  @ApiOkResponse({
    description: 'Required dependencies are available',
    type: ReadinessResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'A required dependency is unavailable',
    type: ReadinessResponseDto,
  })
  async ready(
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<ReadinessResponse> {
    const readiness = await this.health.ready();

    response.status(readiness.status === 'not-ready' ? 503 : 200);
    return readiness;
  }
}
