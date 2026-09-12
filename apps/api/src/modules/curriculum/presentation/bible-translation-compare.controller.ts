import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  comparePassageQuerySchema,
  type ComparePassageQueryOutput,
  type ComparePassageResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { BibleTranslationCompareService } from '../application/bible-translation-compare.service.js';

// Read-only, family-scoped Bible translation comparator (issue #96
// section 16). Same guard pair as every other family-scoped route on
// CurriculumController -- no new authorization. Fetches live passage
// text on demand; never caches or persists it.
@ApiTags('Curriculum Bible Translations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum/bible-translations', version: '1' })
export class BibleTranslationCompareController {
  constructor(private readonly compareService: BibleTranslationCompareService) {}

  @Get('compare')
  @ApiOperation({ summary: 'Compare a passage across multiple published Bible translations' })
  async comparePassage(
    @Param('familyId') _familyId: string,
    @Query(new ZodValidationPipe(comparePassageQuerySchema)) query: ComparePassageQueryOutput,
  ): Promise<ComparePassageResponseDto> {
    return this.compareService.comparePassage(query.reference, query.translationCodes);
  }
}
