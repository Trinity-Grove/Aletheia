import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ComparePassageResponseDto } from '@aletheia/contracts';
import {
  DEVOTIONAL_PUBLIC_API,
  type DevotionalPublicApi,
} from '../../devotional/application/public-api.js';
import { DefinitionsRepository } from '../infrastructure/definitions.repository.js';

// Read-only "compare translations" (issue #96 section 16's "comparador
// trabalha genericamente com qualquer tradução cadastrada"). Fans out to
// the existing YouVersionService.fetchPassage (via DEVOTIONAL_PUBLIC_API,
// module-boundary rule) for each requested, currently-PUBLISHED
// BibleTranslationDefinition. Never caches or persists the fetched text
// beyond this request/response, per YouVersion's terms -- purely
// fetch-and-return, generic over whatever translations are catalogued
// (new translations become comparable the moment they're published, no
// code change).
@Injectable()
export class BibleTranslationCompareService {
  constructor(
    private readonly definitionsRepository: DefinitionsRepository,
    @Inject(DEVOTIONAL_PUBLIC_API) private readonly devotionalPublicApi: DevotionalPublicApi,
  ) {}

  async comparePassage(reference: string, translationCodes: string[]): Promise<ComparePassageResponseDto> {
    const translations =
      await this.definitionsRepository.findLatestPublishedBibleTranslationDefinitionsByCodes(translationCodes);

    if (translations.length === 0) {
      throw new BadRequestException(
        'None of the requested translation codes match a published BibleTranslationDefinition.',
      );
    }

    const results = await Promise.all(
      translations.map(async (translation) => {
        const passage = await this.devotionalPublicApi.lookupScripture(reference, translation.youVersionId);
        return {
          translationCode: translation.code,
          translationName: translation.name,
          reference: passage?.reference ?? reference,
          content: passage?.content ?? '',
          copyright: passage?.copyright,
        };
      }),
    );

    return { reference, results };
  }
}
