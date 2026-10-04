import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type {
  AiLessonPlanDraftResponseDto,
  AiUsageQuotaResponseDto,
  GenerateLessonPlanDraftRequestDto,
  LessonPlanDraftContent,
  ReviewAiSuggestionRequestDto,
} from '@aletheia/contracts';
import { PromptInjectionScanner } from '../domain/prompt-injection-scanner.js';
import { PseudonymizationService } from '../domain/pseudonymizer.js';
import { MockLlmProvider } from '../infrastructure/mock-llm-provider.js';
import { AiSuggestionRepository } from '../infrastructure/ai-suggestion.repository.js';
import { AiQuotaService } from './ai-quota.service.js';
import { PRIVACY_PUBLIC_API, type PrivacyPublicApi } from '../../privacy/application/public-api.js';
import {
  LESSON_PLAN_PUBLIC_API,
  type LessonPlanPublicApi,
} from '../../lessons/application/public-api.js';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type { AiPublicApi } from './public-api.js';

@Injectable()
export class AiSuggestionService implements AiPublicApi {
  constructor(
    private readonly suggestionRepository: AiSuggestionRepository,
    private readonly quotaService: AiQuotaService,
    private readonly pseudonymizationService: PseudonymizationService,
    private readonly mockLlmProvider: MockLlmProvider,
    @Inject(PRIVACY_PUBLIC_API) private readonly privacyApi: PrivacyPublicApi,
    @Optional() @Inject(LESSON_PLAN_PUBLIC_API) private readonly lessonPlanApi: LessonPlanPublicApi | undefined,
    private readonly prisma: PrismaService,
  ) {}

  async generateLessonPlanDraft(
    familyId: string,
    actorUserId: string,
    dto: GenerateLessonPlanDraftRequestDto,
  ): Promise<AiLessonPlanDraftResponseDto> {
    // 1. Check parental compliance
    const compliance = await this.privacyApi.checkMandatoryCompliance(familyId, dto.learnerId);
    if (!compliance.compliant) {
      throw new ForbiddenException({
        error: 'CONSENT_REQUIRED',
        message: 'Parental consent required for AI pedagogical processing.',
        termCode: 'AI_PEDAGOGICAL_ASSISTANCE',
        learnerId: dto.learnerId,
      });
    }

    // 2. Verify quota
    await this.quotaService.verifyQuota(familyId);

    // 3. Scan input instructions for prompt injection
    const inputScan = PromptInjectionScanner.scan({
      topic: dto.topic,
      additionalInstructions: dto.additionalInstructions,
    });
    if (!inputScan.safe) {
      throw new BadRequestException({
        message: 'Prompt injection detected in input instructions',
        violations: inputScan.violations,
      });
    }

    // 4. Lookup learner
    const learner = await this.prisma.learner.findFirst({
      where: { id: dto.learnerId, familyId },
      include: { family: true },
    });
    if (!learner) {
      throw new NotFoundException('Learner not found');
    }

    // 5. Audit sensitive data access
    await this.privacyApi.recordSensitiveDataAccess({
      actorUserId,
      familyId,
      learnerId: dto.learnerId,
      action: 'READ_FOR_AI_ASSISTANCE' as any,
      resourceType: 'LEARNER_PROFILE' as any,
      resourceId: dto.learnerId,
      metadata: { feature: 'LESSON_PLAN_DRAFT' },
    });

    // 6. Mask prompt with PseudonymizationSession
    const learnerDisplayName = learner.preferredName || learner.firstName;
    const learnerAge =
      dto.targetAge ??
      (learner.birthDate
        ? Math.floor((Date.now() - new Date(learner.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
        : undefined);
    const gradeLevel = dto.gradeLevel || learner.customGrade || undefined;

    const session = this.pseudonymizationService.createSession({
      learnerName: learnerDisplayName,
      ...(learner.family?.name ? { familyName: learner.family.name } : {}),
      ...(learnerAge !== undefined ? { ageYears: learnerAge } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
    });

    const promptRaw = [
      `Gere um plano de aula sobre ${dto.topic} para o aluno ${learnerDisplayName}.`,
      `Disciplina: ${dto.subject}.`,
      `Duração: ${dto.durationMinutes ?? 45} minutos.`,
      gradeLevel ? `Ano/Nível: ${gradeLevel}.` : '',
      dto.objectives && dto.objectives.length > 0 ? `Objetivos: ${dto.objectives.join(', ')}.` : '',
      dto.additionalInstructions ? `Instruções adicionais: ${dto.additionalInstructions}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const maskedPrompt = session.mask(promptRaw);

    // 7. Call LLM provider
    const llmResult = await this.mockLlmProvider.generateDraft(maskedPrompt, {
      responseFormat: 'json',
    });

    // 8. Scan output with PromptInjectionScanner
    const outputScan = PromptInjectionScanner.scan(llmResult.parsedJson ?? llmResult.text);
    if (!outputScan.safe) {
      throw new BadRequestException({
        message: 'Prompt injection detected in generated output',
        violations: outputScan.violations,
      });
    }

    // 9. Record quota consumption
    const totalTokens = llmResult.promptTokens + llmResult.completionTokens;
    await this.quotaService.recordUsage(familyId, totalTokens, 1);

    // 10. Save draft in AiSuggestionRepository with status PENDING_REVIEW
    const rawOutput = (llmResult.parsedJson ?? JSON.parse(llmResult.text)) as unknown as LessonPlanDraftContent;
    const suggestion = await this.suggestionRepository.create({
      familyId,
      learnerId: dto.learnerId,
      actorUserId,
      featureType: 'LESSON_PLAN_DRAFT',
      sanitizedPrompt: maskedPrompt,
      rawModelOutput: rawOutput as any,
      provider: llmResult.provider,
      model: llmResult.model,
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      costMicrosUsd: 0,
    });

    // 11. Rehydrate draft in memory with real learner name
    const rehydratedDraft = session.rehydrate(rawOutput);

    // 12. Return AiLessonPlanDraftResponseDto
    return {
      suggestionId: suggestion.id,
      status: 'PENDING_REVIEW',
      draft: rehydratedDraft,
      metadata: {
        provider: llmResult.provider,
        model: llmResult.model,
        promptTokens: llmResult.promptTokens,
        completionTokens: llmResult.completionTokens,
        estimatedCostMicrosUsd: 0,
      },
    };
  }

  async reviewSuggestion(
    familyId: string,
    _actorUserId: string,
    suggestionId: string,
    dto: ReviewAiSuggestionRequestDto,
  ): Promise<{ suggestionId: string; status: string; lessonPlan?: unknown }> {
    // 1. Find suggestion
    const suggestion = await this.suggestionRepository.findById(familyId, suggestionId);
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    // 2. Verify status
    if (suggestion.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Suggestion has already been reviewed');
    }

    // 3. REJECT action
    if (dto.action === 'REJECT') {
      const updated = await this.suggestionRepository.updateStatus(familyId, suggestionId, {
        status: 'REJECTED',
        rejectionReason: dto.rejectionReason ?? null,
      });
      return {
        suggestionId,
        status: updated.status,
      };
    }

    // 4. ACCEPT or MODIFY action
    const finalContent =
      dto.action === 'MODIFY'
        ? dto.finalContent!
        : (suggestion.rawModelOutput as unknown as LessonPlanDraftContent);

    const explicitSubjectId = dto.subjectId;
    let subject = explicitSubjectId
      ? await this.prisma.subject.findFirst({ where: { id: explicitSubjectId, familyId } })
      : await this.prisma.subject.findFirst({ where: { familyId } });

    if (!subject) {
      subject = await this.prisma.subject.create({
        data: {
          familyId,
          name: 'Geral',
        },
      });
    }

    if (!this.lessonPlanApi) {
      throw new Error('LessonPlanPublicApi is not available');
    }

    const scheduledDate = dto.scheduledDate
      ? dto.scheduledDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const totalDuration =
      finalContent.steps?.reduce((acc, step) => acc + (step.durationMinutes || 0), 0) || 45;

    const materials = Array.isArray(finalContent.materials)
      ? finalContent.materials.join(', ')
      : undefined;

    const learnerIds = suggestion.learnerId ? [suggestion.learnerId] : [];

    const lesson = await this.lessonPlanApi.createLessonPlan(familyId, {
      subjectId: subject.id,
      title: finalContent.title,
      description: finalContent.summary,
      date: scheduledDate,
      durationMinutes: totalDuration,
      materials,
      learnerIds,
      objectiveIds: [],
    });

    const targetStatus = dto.action === 'MODIFY' ? 'MODIFIED' : 'ACCEPTED';
    const updated = await this.suggestionRepository.updateStatus(familyId, suggestionId, {
      status: targetStatus,
      finalHumanOutput: finalContent as any,
      createdEntityId: lesson.id,
    });

    return {
      suggestionId,
      status: updated.status,
      lessonPlan: lesson,
    };
  }

  async getFamilyQuota(familyId: string): Promise<AiUsageQuotaResponseDto> {
    return this.quotaService.getFamilyQuota(familyId);
  }
}
