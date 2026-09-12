import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import {
  DEVOTIONAL_PUBLIC_API,
  type DevotionalPublicApi,
} from '../../devotional/application/public-api.js';

// Installs BibleTranslationDefinition rows from the SAME source the
// devotional module's hardcoded POPULAR_BIBLE_VERSIONS array already
// uses (via DEVOTIONAL_PUBLIC_API.getAvailableBibles(), not a
// copy-pasted duplicate) -- this is the strangler-fig proof step (issue
// #96 Fase 3, section 16), mirroring how PedagogicalModelDefinitionSeeder
// proved pedagogical_model_definition equivalent to
// CurriculumTemplateEngine in PR #98. `POPULAR_BIBLE_VERSIONS` itself is
// NOT removed or read from here in production code paths -- this seeder
// is a one-way proof, invoked manually via a script, not on every boot.
//
// Idempotent, same pattern as every other seeder here: installs missing
// baseline rows only, never mutates an existing published version.
@Injectable()
export class BibleTranslationDefinitionSeeder {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DEVOTIONAL_PUBLIC_API) private readonly devotionalPublicApi: DevotionalPublicApi,
  ) {}

  async seed(): Promise<number> {
    const versions = await this.devotionalPublicApi.getAvailableBibles();
    const now = new Date();

    for (const version of versions) {
      const code = version.abbreviation.toUpperCase();
      await this.prisma.bibleTranslationDefinition.upsert({
        where: { code_version: { code, version: 1 } },
        create: {
          code,
          version: 1,
          status: 'PUBLISHED',
          name: version.name,
          language: version.language,
          youVersionId: version.id,
          publishedAt: now,
        },
        update: {},
      });
    }

    return versions.length;
  }
}
