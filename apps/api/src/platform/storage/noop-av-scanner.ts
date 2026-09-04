import { Injectable, Logger } from '@nestjs/common';
import type { AvScanner, AvScanResult } from './av-scanner.js';

// The default AvScanner: an integration point, not a real engine (issue #29
// explicitly scopes "wire up a real antivirus" out). Always reports clean,
// but logs so it's visible in every environment that no real scanning is
// happening yet.
@Injectable()
export class NoopAvScanner implements AvScanner {
  private readonly logger = new Logger(NoopAvScanner.name);

  async scan(storageKey: string): Promise<AvScanResult> {
    this.logger.warn(`No AV scanner configured — skipping scan for "${storageKey}".`);
    return { clean: true };
  }
}
