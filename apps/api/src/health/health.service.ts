import type { HealthResponse } from '@aletheia/contracts';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly version: string = process.env.npm_package_version ?? '0.0.0',
  ) {}

  live(): HealthResponse {
    return {
      status: 'ok',
      service: 'aletheia-api',
      version: this.version,
      timestamp: this.now().toISOString(),
    };
  }
}
