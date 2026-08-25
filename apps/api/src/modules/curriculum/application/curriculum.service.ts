import { Injectable, NotFoundException } from '@nestjs/common';
import { CurriculumRepository } from '../infrastructure/curriculum.repository.js';
import { ObjectiveRepository } from '../infrastructure/objective.repository.js';
import { CurriculumTemplateEngine } from '../infrastructure/curriculum-template.engine.js';
import type {
  AcademicYearResponseDto,
  ApplyCurriculumTemplateDto,
  CreateAcademicYearDto,
  CreateSubjectDto,
  LearnerPlanResponseDto,
  SubjectResponseDto,
  UpdateSubjectDto,
  UpsertLearnerPlanDto,
} from '@aletheia/contracts';
import type { CurriculumPublicApi } from './public-api.js';

@Injectable()
export class CurriculumService implements CurriculumPublicApi {
  constructor(
    private readonly curriculumRepo: CurriculumRepository,
    private readonly objectiveRepo: ObjectiveRepository,
    private readonly templateEngine: CurriculumTemplateEngine,
  ) {}

  // Academic Years
  async createAcademicYear(familyId: string, dto: CreateAcademicYearDto): Promise<AcademicYearResponseDto> {
    const year = await this.curriculumRepo.createAcademicYear(familyId, dto);
    return this.serializeYear(year);
  }

  async listAcademicYears(familyId: string): Promise<AcademicYearResponseDto[]> {
    let years = await this.curriculumRepo.listAcademicYears(familyId);
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultYear = await this.curriculumRepo.createAcademicYear(familyId, {
        year: currentYear,
        title: `Ano Letivo ${currentYear}`,
        isCurrent: true,
      });
      years = [defaultYear];
    }
    return years.map((y) => this.serializeYear(y));
  }

  async getOrCreateCurrentYear(familyId: string): Promise<AcademicYearResponseDto> {
    let current = await this.curriculumRepo.findCurrentAcademicYear(familyId);
    if (!current) {
      const years = await this.curriculumRepo.listAcademicYears(familyId);
      if (years.length > 0) {
        if (years[0]) current = years[0];
      } else {
        const currentYear = new Date().getFullYear();
        current = await this.curriculumRepo.createAcademicYear(familyId, {
          year: currentYear,
          title: `Ano Letivo ${currentYear}`,
          isCurrent: true,
        });
      }
    }
    return this.serializeYear(current);
  }

  // Subjects
  async createSubject(familyId: string, dto: CreateSubjectDto): Promise<SubjectResponseDto> {
    const subject = await this.curriculumRepo.createSubject(familyId, dto);
    return this.serializeSubject(subject);
  }

  async listSubjects(familyId: string, includeArchived = false): Promise<SubjectResponseDto[]> {
    const subjects = await this.curriculumRepo.listSubjects(familyId, includeArchived);
    return subjects.map((s) => this.serializeSubject(s));
  }

  async updateSubject(familyId: string, id: string, dto: UpdateSubjectDto): Promise<SubjectResponseDto> {
    const subject = await this.curriculumRepo.updateSubject(familyId, id, dto);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return this.serializeSubject(subject);
  }

  async archiveSubject(familyId: string, id: string): Promise<SubjectResponseDto> {
    const subject = await this.curriculumRepo.archiveSubject(familyId, id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return this.serializeSubject(subject);
  }

  // Learner Plans
  async upsertLearnerPlan(familyId: string, dto: UpsertLearnerPlanDto): Promise<LearnerPlanResponseDto> {
    const plan = await this.curriculumRepo.upsertLearnerPlan(familyId, dto);
    return this.serializePlan(plan);
  }

  async getLearnerPlan(
    familyId: string,
    learnerId: string,
    academicYearId: string,
  ): Promise<LearnerPlanResponseDto | null> {
    const plan = await this.curriculumRepo.findLearnerPlan(familyId, learnerId, academicYearId);
    return plan ? this.serializePlan(plan) : null;
  }

  // Apply Template Accelerator
  async applyTemplate(familyId: string, dto: ApplyCurriculumTemplateDto): Promise<{ subjectsCount: number; objectivesCount: number }> {
    await this.curriculumRepo.upsertLearnerPlan(familyId, {
      learnerId: dto.learnerId,
      academicYearId: dto.academicYearId,
      pedagogicalFramework: dto.template,
    });

    const definitions = this.templateEngine.getTemplateDefinitions(dto.template);
    let createdObjectives = 0;
    let createdSubjects = 0;

    for (const def of definitions) {
      let subject = await this.curriculumRepo.findSubjectByName(familyId, def.name);
      if (!subject) {
        subject = await this.curriculumRepo.createSubject(familyId, {
          name: def.name,
          color: def.color,
          icon: def.icon,
          description: def.description,
        });
        createdSubjects++;
      }

      for (let i = 0; i < def.starterObjectives.length; i++) {
        const title = def.starterObjectives[i];
        if (!title) continue;
        await this.objectiveRepo.create(familyId, {
          learnerId: dto.learnerId,
          subjectId: subject.id,
          academicYearId: dto.academicYearId,
          title,
          order: i,
        });
        createdObjectives++;
      }
    }

    return { subjectsCount: createdSubjects, objectivesCount: createdObjectives };
  }

  async getLearnerCurriculumSummary(
    familyId: string,
    learnerId: string,
  ): Promise<{ totalObjectives: number; achievedObjectives: number }> {
    const counts = await this.objectiveRepo.countLearnerObjectives(familyId, learnerId);
    return {
      totalObjectives: counts.total,
      achievedObjectives: counts.achieved,
    };
  }

  private serializeYear(y: any): AcademicYearResponseDto {
    return {
      id: y.id,
      familyId: y.familyId,
      year: y.year,
      title: y.title,
      startDate: y.startDate ? y.startDate.toISOString().split('T')[0] : undefined,
      endDate: y.endDate ? y.endDate.toISOString().split('T')[0] : undefined,
      isCurrent: y.isCurrent,
      createdAt: y.createdAt.toISOString(),
      updatedAt: y.updatedAt.toISOString(),
    };
  }

  private serializeSubject(s: any): SubjectResponseDto {
    return {
      id: s.id,
      familyId: s.familyId,
      name: s.name,
      color: s.color,
      icon: s.icon,
      description: s.description,
      archivedAt: s.archivedAt ? s.archivedAt.toISOString() : undefined,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  private serializePlan(p: any): LearnerPlanResponseDto {
    return {
      id: p.id,
      familyId: p.familyId,
      learnerId: p.learnerId,
      academicYearId: p.academicYearId,
      pedagogicalFramework: p.pedagogicalFramework,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
