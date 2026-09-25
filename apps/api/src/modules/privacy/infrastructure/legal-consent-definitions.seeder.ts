import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { ALL_LEGAL_CONSENT_DEFINITIONS } from './legal-consent-definitions.seed-data.js';

export interface LegalConsentSeedResult {
  total: number;
  created: number;
  existing: number;
}

@Injectable()
export class LegalConsentDefinitionsSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<LegalConsentSeedResult> {
    let created = 0;
    let existing = 0;

    for (const entry of ALL_LEGAL_CONSENT_DEFINITIONS) {
      const found = await this.prisma.consentDefinition.findUnique({
        where: { code_version: { code: entry.code, version: 1 } },
      });

      if (found) {
        existing++;
        continue;
      }

      await this.prisma.consentDefinition.create({
        data: {
          code: entry.code,
          version: 1,
          status: 'PUBLISHED',
          scope: entry.scope,
          mandatory: true,
          title: entry.title,
          description: entry.description,
          content: entry.content,
          purposes: entry.purposes,
          publishedAt: new Date(),
        },
      });
      created++;
    }

    return {
      total: ALL_LEGAL_CONSENT_DEFINITIONS.length,
      created,
      existing,
    };
  }
}
