import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ComplianceEvaluationResponseDto,
  ComplianceEvaluationStatus,
  CriterionEvaluationDto,
  CreateManualComplianceOverrideDto,
  ManualComplianceOverrideResponseDto,
  JurisdictionComplianceMetadata,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { JurisdictionDefinitionsRepository } from '../infrastructure/jurisdiction-definitions.repository.js';

export const COMPLIANCE_LEGAL_DISCLAIMER =
  'O Aletheia é uma plataforma de gestão e auto-organização educacional familiar. ' +
  'Não substitui aconselhamento jurídico formal, fiscalização escolar ou garantia de imunidade legal perante órgãos estatais. ' +
  'As informações refletem os registros declarados pela família confrontados com as diretrizes normativas cadastradas.';

@Injectable()
export class ComplianceEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jurisdictionRepo: JurisdictionDefinitionsRepository,
  ) {}

  async evaluateCompliance(
    familyId: string,
    learnerId: string,
    academicYearId?: string,
  ): Promise<ComplianceEvaluationResponseDto> {
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner || learner.familyId !== familyId) {
      throw new NotFoundException('Learner not found');
    }

    let academicYear = null;
    if (academicYearId) {
      academicYear = await this.prisma.academicYear.findUnique({
        where: { id: academicYearId },
      });
      if (!academicYear || academicYear.familyId !== familyId) {
        throw new NotFoundException('Academic year not found');
      }
    } else {
      academicYear =
        (await this.prisma.academicYear.findFirst({
          where: { familyId, isCurrent: true },
        })) ??
        (await this.prisma.academicYear.findFirst({
          where: { familyId },
          orderBy: { year: 'desc' },
        }));
    }

    const learnerName = `${learner.firstName}${learner.lastName ? ` ${learner.lastName}` : ''}`;

    // 1. Gather attendance metrics
    let presentDays = 0;
    let totalHours = 0;

    if (academicYear) {
      const records = await this.prisma.attendanceRecord.findMany({
        where: {
          familyId,
          learnerId,
          academicYearId: academicYear.id,
        },
      });

      for (const rec of records) {
        if (rec.hoursSpent) {
          totalHours += rec.hoursSpent;
        }
        if (rec.status === 'PRESENT' || rec.status === 'FIELD_TRIP') {
          presentDays += 1;
        }
      }
    }

    // 2. Find compliance requirement and jurisdiction definition
    let requirement = null;
    if (academicYear) {
      requirement = await this.prisma.complianceRequirement.findUnique({
        where: {
          familyId_academicYearId_learnerId: {
            familyId,
            academicYearId: academicYear.id,
            learnerId,
          },
        },
      });

      if (!requirement) {
        requirement = await this.prisma.complianceRequirement.findFirst({
          where: {
            familyId,
            academicYearId: academicYear.id,
            learnerId: null,
          },
        });
      }
    }

    let jurisdictionDef = null;
    if (requirement?.jurisdictionDefinitionId) {
      jurisdictionDef = await this.jurisdictionRepo.findById(requirement.jurisdictionDefinitionId);
    }
    if (!jurisdictionDef && requirement?.jurisdiction) {
      jurisdictionDef = await this.jurisdictionRepo.findCurrentPublishedByCode(requirement.jurisdiction);
    }

    // 3. Check manual override early so it is available regardless of jurisdiction status
    let manualOverrideDto: ManualComplianceOverrideResponseDto | null = null;
    if (academicYear) {
      const override = await this.prisma.complianceManualOverride.findFirst({
        where: {
          familyId,
          learnerId,
          academicYearId: academicYear.id,
        },
        orderBy: { createdAt: 'desc' },
        include: { overriddenByUser: true },
      });

      if (override) {
        manualOverrideDto = {
          id: override.id,
          status: override.status as ComplianceEvaluationStatus,
          reason: override.reason,
          overriddenByUserId: override.overriddenByUserId,
          overriddenByName: override.overriddenByUser?.fullName ?? 'Responsável',
          createdAt: override.createdAt.toISOString(),
        };
      }
    }

    // 4. Evaluate criteria
    const criteriaBreakdown: CriterionEvaluationDto[] = [];
    let overallStatus: ComplianceEvaluationStatus = manualOverrideDto?.status ?? 'COMPLIANT';
    let statusSummary = manualOverrideDto
      ? `Sobreposição manual registrada por ${manualOverrideDto.overriddenByName}: "${manualOverrideDto.reason}". Status definido como ${manualOverrideDto.status}.`
      : '';

    if (!jurisdictionDef) {
      if (!manualOverrideDto) {
        overallStatus = 'REVIEW_NEEDED';
        statusSummary =
          'Revisão Necessária: Nenhuma jurisdição regulatória configurada para este período ou educando. ' +
          'O sistema nunca presume conformidade quando as regras legais são desconhecidas.';
      }

      return {
        learnerId,
        learnerName,
        academicYearId: academicYear?.id ?? null,
        academicYearTitle: academicYear?.title ?? null,
        overallStatus,
        statusSummary,
        jurisdiction: {
          id: null,
          code: 'UNKNOWN',
          version: 0,
          name: 'Jurisdição não configurada',
          confidenceLevel: 'UNCERTAIN',
          officialSource: null,
          legalBasisNotes: 'Vincule uma jurisdição cadastrada (ex.: BR, UY, US-TX, US-FL) nas configurações do ano letivo.',
        },
        criteriaBreakdown,
        manualOverride: manualOverrideDto,
        legalDisclaimer: COMPLIANCE_LEGAL_DISCLAIMER,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const metadata = (jurisdictionDef.metadata ?? {}) as JurisdictionComplianceMetadata;
    const isYearEnded = Boolean(
      academicYear?.endDate && new Date() > new Date(academicYear.endDate),
    );

    // Criterion A: Instructional Days
    const targetDays = requirement?.minInstructionalDays ?? metadata.minInstructionalDays ?? null;
    if (targetDays === null || targetDays === 0) {
      criteriaBreakdown.push({
        criterion: 'INSTRUCTIONAL_DAYS',
        label: 'Dias Letivos',
        status: 'EXEMPT',
        currentValue: presentDays,
        targetValue: null,
        explanation: 'Esta jurisdição não impõe exigência mínima de dias letivos anuais.',
        ruleCitation: metadata.officialSource ?? null,
      });
    } else {
      let daysStatus: ComplianceEvaluationStatus = 'IN_PROGRESS';
      let explanation = '';
      if (presentDays >= targetDays) {
        daysStatus = 'COMPLIANT';
        explanation = `Cumprido: ${presentDays} de ${targetDays} dias letivos registrados.`;
      } else if (isYearEnded) {
        daysStatus = 'NON_COMPLIANT';
        explanation = `Ano letivo encerrado com apenas ${presentDays} dos ${targetDays} dias mínimos exigidos.`;
      } else {
        const pct = Math.round((presentDays / targetDays) * 100);
        daysStatus = 'IN_PROGRESS';
        explanation = `Em andamento: ${presentDays} de ${targetDays} dias letivos registrados (${pct}%).`;
      }

      criteriaBreakdown.push({
        criterion: 'INSTRUCTIONAL_DAYS',
        label: 'Dias Letivos',
        status: daysStatus,
        currentValue: presentDays,
        targetValue: targetDays,
        explanation,
        ruleCitation: metadata.officialSource ?? null,
      });
    }

    // Criterion B: Instructional Hours
    const targetHours = requirement?.minInstructionalHours ?? metadata.minInstructionalHours ?? null;
    const roundedHours = Math.round(totalHours * 10) / 10;
    if (targetHours === null || targetHours === 0) {
      criteriaBreakdown.push({
        criterion: 'INSTRUCTIONAL_HOURS',
        label: 'Carga Horária',
        status: 'EXEMPT',
        currentValue: roundedHours,
        targetValue: null,
        explanation: 'Esta jurisdição não estabelece um mínimo estatutário de horas letivas.',
        ruleCitation: metadata.officialSource ?? null,
      });
    } else {
      let hoursStatus: ComplianceEvaluationStatus = 'IN_PROGRESS';
      let explanation = '';
      if (roundedHours >= targetHours) {
        hoursStatus = 'COMPLIANT';
        explanation = `Cumprido: ${roundedHours} de ${targetHours} horas registradas.`;
      } else if (isYearEnded) {
        hoursStatus = 'NON_COMPLIANT';
        explanation = `Ano letivo encerrado com apenas ${roundedHours} das ${targetHours} horas mínimas exigidas.`;
      } else {
        const pct = Math.round((roundedHours / targetHours) * 100);
        hoursStatus = 'IN_PROGRESS';
        explanation = `Em andamento: ${roundedHours} de ${targetHours} horas registradas (${pct}%).`;
      }

      criteriaBreakdown.push({
        criterion: 'INSTRUCTIONAL_HOURS',
        label: 'Carga Horária',
        status: hoursStatus,
        currentValue: roundedHours,
        targetValue: targetHours,
        explanation,
        ruleCitation: metadata.officialSource ?? null,
      });
    }

    // Criterion C: Learner Age
    if (learner.birthDate) {
      const birth = new Date(learner.birthDate);
      const now = new Date();
      const ageDiff = now.getFullYear() - birth.getFullYear();
      const hasHadBirthdayThisYear =
        now.getMonth() > birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
      const age = hasHadBirthdayThisYear ? ageDiff : ageDiff - 1;

      const minAge = metadata.minLearnerAge ?? null;
      const maxAge = metadata.maxLearnerAge ?? null;

      if (minAge === null && maxAge === null) {
        criteriaBreakdown.push({
          criterion: 'LEARNER_AGE',
          label: 'Faixa Etária Obrigatória',
          status: 'EXEMPT',
          currentValue: `${age} anos`,
          targetValue: null,
          explanation: 'Esta jurisdição não especifica faixas etárias estritas de escolarização obrigatória.',
          ruleCitation: metadata.officialSource ?? null,
        });
      } else if (minAge !== null && age < minAge) {
        criteriaBreakdown.push({
          criterion: 'LEARNER_AGE',
          label: 'Faixa Etária Obrigatória',
          status: 'EXEMPT',
          currentValue: `${age} anos`,
          targetValue: `A partir de ${minAge} anos`,
          explanation: `Educando tem ${age} anos, abaixo da idade de escolarização compulsória (${minAge} anos).`,
          ruleCitation: metadata.officialSource ?? null,
        });
      } else if (maxAge !== null && age > maxAge) {
        criteriaBreakdown.push({
          criterion: 'LEARNER_AGE',
          label: 'Faixa Etária Obrigatória',
          status: 'EXEMPT',
          currentValue: `${age} anos`,
          targetValue: `Até ${maxAge} anos`,
          explanation: `Educando tem ${age} anos, acima do limite etário de escolarização compulsória (${maxAge} anos).`,
          ruleCitation: metadata.officialSource ?? null,
        });
      } else {
        criteriaBreakdown.push({
          criterion: 'LEARNER_AGE',
          label: 'Faixa Etária Obrigatória',
          status: 'COMPLIANT',
          currentValue: `${age} anos`,
          targetValue: `${minAge ?? 0} a ${maxAge ?? 18} anos`,
          explanation: `Educando tem ${age} anos, dentro da faixa de escolarização obrigatória (${minAge ?? 0} a ${maxAge ?? 18} anos).`,
          ruleCitation: metadata.officialSource ?? null,
        });
      }
    } else {
      criteriaBreakdown.push({
        criterion: 'LEARNER_AGE',
        label: 'Faixa Etária Obrigatória',
        status: 'REVIEW_NEEDED',
        currentValue: null,
        targetValue: null,
        explanation: 'Data de nascimento do educando não informada; verifique a faixa etária obrigatória.',
        ruleCitation: metadata.officialSource ?? null,
      });
    }

    // Criterion D: Required Subjects
    const reqSubjects = metadata.requiredSubjects ?? [];
    if (reqSubjects.length === 0) {
      criteriaBreakdown.push({
        criterion: 'REQUIRED_SUBJECTS',
        label: 'Disciplinas Obrigatórias',
        status: 'EXEMPT',
        currentValue: null,
        targetValue: null,
        explanation: 'Não há elenco fixo de disciplinas obrigatórias cadastrado para esta jurisdição.',
        ruleCitation: metadata.officialSource ?? null,
      });
    } else {
      const familySubjects = await this.prisma.subject.findMany({
        where: { familyId, archivedAt: null },
      });

      const matchedSubjects = new Set<string>();
      for (const reqSub of reqSubjects) {
        const normalizedReq = reqSub.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matched = familySubjects.some((s) => {
          const normName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normName.includes(normalizedReq) || normalizedReq.includes(normName)) {
            return true;
          }
          // Synonym mappings (Portuguese <-> English curriculum terms)
          if (
            (normalizedReq === 'reading' && (normName.includes('leit') || normName.includes('portug'))) ||
            (normalizedReq === 'spelling' && (normName.includes('ortog') || normName.includes('gramat'))) ||
            (normalizedReq === 'grammar' && (normName.includes('gramat') || normName.includes('portug'))) ||
            (normalizedReq === 'mathematics' && (normName.includes('matemat') || normName.includes('math'))) ||
            (normalizedReq === 'goodcitizenship' &&
              (normName.includes('cidad') || normName.includes('social') || normName.includes('civic') || normName.includes('hist')))
          ) {
            return true;
          }
          return false;
        });

        if (matched) {
          matchedSubjects.add(reqSub);
        }
      }

      const allCovered = matchedSubjects.size === reqSubjects.length;
      criteriaBreakdown.push({
        criterion: 'REQUIRED_SUBJECTS',
        label: 'Disciplinas Obrigatórias',
        status: allCovered ? 'COMPLIANT' : 'IN_PROGRESS',
        currentValue: matchedSubjects.size,
        targetValue: reqSubjects.length,
        explanation: allCovered
          ? `Todas as ${reqSubjects.length} disciplinas obrigatórias estão contempladas no plano de estudos.`
          : `${matchedSubjects.size} de ${reqSubjects.length} disciplinas obrigatórias atendidas. Faltam: ${reqSubjects
              .filter((s) => !matchedSubjects.has(s))
              .join(', ')}.`,
        ruleCitation: metadata.officialSource ?? null,
      });
    }

    // Criterion E: Periodic Evaluations
    if (metadata.evaluationRequirements) {
      const evalStatus: ComplianceEvaluationStatus =
        metadata.confidenceLevel === 'UNCERTAIN' || metadata.confidenceLevel === 'CONTESTED'
          ? 'REVIEW_NEEDED'
          : 'IN_PROGRESS';

      criteriaBreakdown.push({
        criterion: 'EVALUATIONS',
        label: 'Avaliações Periódicas',
        status: evalStatus,
        currentValue: null,
        targetValue: null,
        explanation: metadata.evaluationRequirements,
        ruleCitation: metadata.officialSource ?? null,
      });
    }

    // Criterion F: Notifications & Registration
    if (metadata.notificationRequirements) {
      criteriaBreakdown.push({
        criterion: 'NOTIFICATIONS',
        label: 'Notificações e Registro',
        status: 'REVIEW_NEEDED',
        currentValue: null,
        targetValue: null,
        explanation: metadata.notificationRequirements,
        ruleCitation: metadata.officialSource ?? null,
      });
    }

    // 5. Compute automated overall status if not overridden
    if (!manualOverrideDto) {
      if (metadata.confidenceLevel === 'UNCERTAIN') {
        overallStatus = 'REVIEW_NEEDED';
        statusSummary =
          'Revisão Necessária: A jurisdição selecionada possui alto grau de incerteza jurídica ou jurisprudência instável. ' +
          'Consulte a situação legal específica.';
      } else if (criteriaBreakdown.some((c) => c.status === 'NON_COMPLIANT')) {
        overallStatus = 'NON_COMPLIANT';
        statusSummary = 'Não Conforme: Existem requisitos legais mínimos obrigatórios não atendidos no período.';
      } else if (criteriaBreakdown.some((c) => c.status === 'REVIEW_NEEDED')) {
        overallStatus = 'REVIEW_NEEDED';
        statusSummary = 'Revisão Necessária: Existem critérios que demandam atenção ou validação manual pela família.';
      } else if (criteriaBreakdown.some((c) => c.status === 'IN_PROGRESS')) {
        overallStatus = 'IN_PROGRESS';
        statusSummary = 'Em Andamento: Os registros de frequência e plano curricular estão dentro do cronograma esperado.';
      } else {
        overallStatus = 'COMPLIANT';
        statusSummary = 'Conforme: Todos os critérios legais cadastrados para o período foram atendidos.';
      }
    }

    return {
      learnerId,
      learnerName,
      academicYearId: academicYear?.id ?? null,
      academicYearTitle: academicYear?.title ?? null,
      overallStatus,
      statusSummary,
      jurisdiction: {
        id: jurisdictionDef.id,
        code: jurisdictionDef.code,
        version: jurisdictionDef.version,
        name: jurisdictionDef.name,
        confidenceLevel: metadata.confidenceLevel,
        officialSource: metadata.officialSource ?? null,
        legalBasisNotes: metadata.legalBasisNotes ?? null,
      },
      criteriaBreakdown,
      manualOverride: manualOverrideDto,
      legalDisclaimer: COMPLIANCE_LEGAL_DISCLAIMER,
      evaluatedAt: new Date().toISOString(),
    };
  }

  async recordManualOverride(
    familyId: string,
    actorId: string,
    dto: CreateManualComplianceOverrideDto,
  ): Promise<ManualComplianceOverrideResponseDto> {
    const learner = await this.prisma.learner.findUnique({
      where: { id: dto.learnerId },
    });
    if (!learner || learner.familyId !== familyId) {
      throw new NotFoundException('Learner not found');
    }

    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!academicYear || academicYear.familyId !== familyId) {
      throw new NotFoundException('Academic year not found');
    }

    const record = await this.prisma.complianceManualOverride.create({
      data: {
        familyId,
        learnerId: dto.learnerId,
        academicYearId: dto.academicYearId,
        status: dto.status,
        reason: dto.reason,
        overriddenByUserId: actorId,
      },
      include: {
        overriddenByUser: true,
      },
    });

    return {
      id: record.id,
      status: record.status as ComplianceEvaluationStatus,
      reason: record.reason,
      overriddenByUserId: record.overriddenByUserId,
      overriddenByName: record.overriddenByUser?.fullName ?? null,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
