import { Injectable } from '@nestjs/common';

// Module-local mirror of the donations module's env reader. It reads the
// same `process.env`, but it is a distinct class on purpose: importing
// donations/infrastructure from here is a cross-module infrastructure
// import, which scripts/check-module-boundaries.mjs rejects. Each module
// gets its own reader rather than one shared in another module's layer.
@Injectable()
export class ConfigService {
  get<T = string>(key: string): T | undefined {
    return (process.env[key] as unknown as T) ?? undefined;
  }
}