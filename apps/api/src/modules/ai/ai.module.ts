import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { PrivacyModule } from '../privacy/privacy.module.js';
import { LessonsModule } from '../lessons/lessons.module.js';
import { FamiliesModule } from '../families/families.module.js';
import { AiController } from './presentation/ai.controller.js';
import { AiSuggestionRepository } from './infrastructure/ai-suggestion.repository.js';
import { AiFamilyUsageRepository } from './infrastructure/ai-family-usage.repository.js';
import { PseudonymizationService } from './domain/pseudonymizer.js';
import { MockLlmProvider } from './infrastructure/mock-llm-provider.js';
import { PromptInjectionScanner } from './domain/prompt-injection-scanner.js';
import { AiQuotaService } from './application/ai-quota.service.js';
import { AiSuggestionService } from './application/ai-suggestion.service.js';
import { AI_PUBLIC_API } from './application/public-api.js';

@Module({
  imports: [
    DatabaseModule,
    PrivacyModule,
    LessonsModule,
    FamiliesModule,
  ],
  controllers: [AiController],
  providers: [
    AiSuggestionRepository,
    AiFamilyUsageRepository,
    PseudonymizationService,
    MockLlmProvider,
    PromptInjectionScanner,
    AiQuotaService,
    AiSuggestionService,
    {
      provide: AI_PUBLIC_API,
      useExisting: AiSuggestionService,
    },
  ],
  exports: [
    AI_PUBLIC_API,
    AiSuggestionService,
    AiQuotaService,
  ],
})
export class AiModule {}
