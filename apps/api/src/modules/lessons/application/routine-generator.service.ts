import { Injectable } from '@nestjs/common';
import {
  suggestRoutineInputSchema,
  type ApplySuggestedRoutineDto,
  type DayOfWeek,
  type RoutineSlotType,
  type ScheduleSlotResponseDto,
  type SuggestedRoutineResponseDto,
  type SuggestedRoutineSlotDto,
  type SuggestRoutineInputDto,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { ScheduleSlotEntity } from '../domain/schedule-slot.entity.js';

interface SubjectPlanItem {
  name: string;
  color: string;
  slotType: RoutineSlotType;
  durationMinutes?: number;
  notes?: string;
}

@Injectable()
export class RoutineGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  private addMinutes(timeStr: string, minutes: number): string {
    const [hStr, mStr] = timeStr.split(':');
    const totalMinutes = parseInt(hStr || '8', 10) * 60 + parseInt(mStr || '0', 10) + minutes;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private getMinutesDiff(startStr: string, endStr: string): number {
    const [h1, m1] = startStr.split(':').map((v) => parseInt(v, 10));
    const [h2, m2] = endStr.split(':').map((v) => parseInt(v, 10));
    return (h2! * 60 + m2!) - (h1! * 60 + m1!);
  }

  async suggestRoutine(
    familyId: string,
    input: SuggestRoutineInputDto = {},
  ): Promise<SuggestedRoutineResponseDto> {
    const parsed = suggestRoutineInputSchema.parse(input);
    const modelCode = parsed.pedagogicalModelCode;
    const startHour = parsed.startHour;
    const defaultDuration = parsed.lessonDurationMinutes;
    const includeDevotional = parsed.includeDevotional;
    const fridaysForProjects = parsed.fridaysForProjects;

    const slots: SuggestedRoutineSlotDto[] = [];

    const weekDays: DayOfWeek[] = [1, 2, 3, 4, 5];

    let rationale = '';

    if (modelCode.toUpperCase().includes('CHARLOTTE')) {
      rationale =
        'Rotina Charlotte Mason: lições curtas e intensas (20-25 min), alternando esforço intelectual analítico com hábitos ao ar livre, leitura de livros vivos e narração oral diária.';
    } else if (modelCode.toUpperCase().includes('CLASSIC')) {
      rationale =
        'Rotina Clássica: blocos estruturados de Trivium com foco em gramática, memorização rigorosa, lógica inicial e leitura intensiva de grandes obras.';
    } else if (modelCode.toUpperCase().includes('MONTESSORI') || modelCode.toUpperCase().includes('UNIT')) {
      rationale =
        'Rotina Montessori / Unit Studies: ciclos estendidos de trabalho (45-60 min) promovendo autonomia, exploração prática sensorial e investigação interdisciplinar.';
    } else {
      rationale =
        'Rotina Pedagógica Integrada: distribuição equilibrada com concentração matinal, hábitos formativos e desenvolvimento cognitivo progressivo.';
    }

    const getDailySubjects = (day: DayOfWeek): SubjectPlanItem[] => {
      if (day === 5 && fridaysForProjects) {
        return [
          {
            name: 'Estudo da Natureza & Caderno Vivo',
            color: '#16A34A',
            slotType: 'OUTDOOR_HABIT',
            durationMinutes: 45,
            notes: 'Caminhada exploratória, observação e registro em caderno da natureza',
          },
          {
            name: 'Ofícios Práticos & Trabalhos Manuais',
            color: '#D97706',
            slotType: 'PROJECT_TRADES',
            durationMinutes: 45,
            notes: 'Marcenaria, jardinagem, culinária ou artes manuais práticas',
          },
          {
            name: 'Revisão Semanal & Portfólio',
            color: '#4F46E5',
            slotType: 'INSTRUCTION',
            durationMinutes: 30,
            notes: 'Organização das produções da semana e autoavaliação guiada',
          },
        ];
      }

      if (modelCode.toUpperCase().includes('CHARLOTTE')) {
        switch (day) {
          case 1:
            return [
              { name: 'Matemática', color: '#2563EB', slotType: 'INSTRUCTION', notes: 'Raciocínio aritmético com foco em precisão e atenção total' },
              { name: 'Gramática & Escrita', color: '#0891B2', slotType: 'INSTRUCTION', notes: 'Cópia cuidadosa e análise sintática inicial' },
              { name: 'Pausa Ativa ao Ar Livre', color: '#16A34A', slotType: 'OUTDOOR_HABIT', durationMinutes: 15, notes: 'Movimento livre e respiração' },
              { name: 'História Viva', color: '#D97706', slotType: 'INSTRUCTION', notes: 'Leitura de biografias e narração oral imediata' },
              { name: 'Leitura em Voz Alta', color: '#7C3AED', slotType: 'INSTRUCTION', notes: 'Literatura formativa compartilhada' },
            ];
          case 2:
            return [
              { name: 'Matemática', color: '#2563EB', slotType: 'INSTRUCTION', notes: 'Prática de cálculo e problemas lógicos' },
              { name: 'Estudo da Natureza', color: '#059669', slotType: 'INSTRUCTION', notes: 'Observação científica direta e registro' },
              { name: 'Pausa Ativa ao Ar Livre', color: '#16A34A', slotType: 'OUTDOOR_HABIT', durationMinutes: 15, notes: 'Brincadeira livre' },
              { name: 'Geografia & Viagens', color: '#EA580C', slotType: 'INSTRUCTION', notes: 'Mapas e exploração narrativa de povos' },
              { name: 'Poesia & Recitação', color: '#9333EA', slotType: 'INSTRUCTION', notes: 'Apreciação poética e memória de versos' },
            ];
          case 3:
            return [
              { name: 'Matemática', color: '#2563EB', slotType: 'INSTRUCTION' },
              { name: 'Gramática & Escrita', color: '#0891B2', slotType: 'INSTRUCTION' },
              { name: 'Pausa Ativa ao Ar Livre', color: '#16A34A', slotType: 'OUTDOOR_HABIT', durationMinutes: 15 },
              { name: 'Ciências Vivas', color: '#059669', slotType: 'INSTRUCTION' },
              { name: 'Arte & Apreciação Musical', color: '#DB2777', slotType: 'INSTRUCTION' },
            ];
          case 4:
            return [
              { name: 'Matemática', color: '#2563EB', slotType: 'INSTRUCTION' },
              { name: 'Cópia & Caligrafia', color: '#0891B2', slotType: 'INSTRUCTION' },
              { name: 'Pausa Ativa ao Ar Livre', color: '#16A34A', slotType: 'OUTDOOR_HABIT', durationMinutes: 15 },
              { name: 'História Viva', color: '#D97706', slotType: 'INSTRUCTION' },
              { name: 'Literatura Formativa', color: '#7C3AED', slotType: 'INSTRUCTION' },
            ];
          default:
            return [
              { name: 'Matemática', color: '#2563EB', slotType: 'INSTRUCTION' },
              { name: 'Leitura & Narração', color: '#7C3AED', slotType: 'INSTRUCTION' },
              { name: 'História & Geografia', color: '#D97706', slotType: 'INSTRUCTION' },
              { name: 'Ciências da Natureza', color: '#059669', slotType: 'INSTRUCTION' },
            ];
        }
      }

      if (modelCode.toUpperCase().includes('CLASSIC')) {
        switch (day) {
          case 1:
            return [
              { name: 'Trivium: Gramática & Linguagem', color: '#0891B2', slotType: 'INSTRUCTION', notes: 'Estruturas da linguagem e memorização de regras' },
              { name: 'Matemática Clássica', color: '#2563EB', slotType: 'INSTRUCTION', notes: 'Aritmética dedutiva e raciocínio lógico' },
              { name: 'Memorização & Poesia', color: '#7C3AED', slotType: 'INSTRUCTION', notes: 'Recitação de textos canônicos' },
              { name: 'História das Civilizações', color: '#D97706', slotType: 'INSTRUCTION', notes: 'Período clássico e linha do tempo cronológica' },
            ];
          case 2:
            return [
              { name: 'Trivium: Vocabulário / Latim', color: '#0891B2', slotType: 'INSTRUCTION' },
              { name: 'Matemática Clássica', color: '#2563EB', slotType: 'INSTRUCTION' },
              { name: 'Ciências Naturais', color: '#059669', slotType: 'INSTRUCTION' },
              { name: 'Leitura de Grandes Livros', color: '#7C3AED', slotType: 'INSTRUCTION' },
            ];
          case 3:
            return [
              { name: 'Trivium: Redação & Composição', color: '#0891B2', slotType: 'INSTRUCTION' },
              { name: 'Matemática Clássica', color: '#2563EB', slotType: 'INSTRUCTION' },
              { name: 'Lógica & Raciocínio', color: '#4F46E5', slotType: 'INSTRUCTION' },
              { name: 'História das Civilizações', color: '#D97706', slotType: 'INSTRUCTION' },
            ];
          case 4:
            return [
              { name: 'Trivium: Vocabulário / Latim', color: '#0891B2', slotType: 'INSTRUCTION' },
              { name: 'Matemática Clássica', color: '#2563EB', slotType: 'INSTRUCTION' },
              { name: 'Ciências Naturais', color: '#059669', slotType: 'INSTRUCTION' },
              { name: 'Leitura de Grandes Livros', color: '#7C3AED', slotType: 'INSTRUCTION' },
            ];
          default:
            return [
              { name: 'Trivium: Gramática', color: '#0891B2', slotType: 'INSTRUCTION' },
              { name: 'Matemática Clássica', color: '#2563EB', slotType: 'INSTRUCTION' },
              { name: 'História & Geografia Clássica', color: '#D97706', slotType: 'INSTRUCTION' },
              { name: 'Recitação & Memória', color: '#7C3AED', slotType: 'INSTRUCTION' },
            ];
        }
      }

      if (modelCode.toUpperCase().includes('MONTESSORI') || modelCode.toUpperCase().includes('UNIT')) {
        switch (day) {
          case 1:
            return [
              { name: 'Ciclo de Matemática Prática', color: '#2563EB', slotType: 'INSTRUCTION', durationMinutes: 50, notes: 'Material concreto e cálculo auto-corretivo' },
              { name: 'Vida Prática & Autonomia', color: '#D97706', slotType: 'PROJECT_TRADES', durationMinutes: 45, notes: 'Habilidades manuais e cuidados domésticos' },
              { name: 'Linguagem & Escrita Criativa', color: '#0891B2', slotType: 'INSTRUCTION', durationMinutes: 45 },
            ];
          case 2:
            return [
              { name: 'Exploração Botânica & Ciências', color: '#059669', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Ciclo de Matemática Prática', color: '#2563EB', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Leitura Livre & Pesquisa', color: '#7C3AED', slotType: 'INSTRUCTION', durationMinutes: 40 },
            ];
          case 3:
            return [
              { name: 'Estudos Culturais & Geografia', color: '#EA580C', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Ciclo de Matemática Prática', color: '#2563EB', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Artes Manuais & Sensoriais', color: '#DB2777', slotType: 'PROJECT_TRADES', durationMinutes: 45 },
            ];
          case 4:
            return [
              { name: 'Linguagem & Escrita Criativa', color: '#0891B2', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Investigação Científica', color: '#059669', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Vida Prática & Culinária', color: '#D97706', slotType: 'PROJECT_TRADES', durationMinutes: 45 },
            ];
          default:
            return [
              { name: 'Ciclo de Matemática', color: '#2563EB', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Exploração Temática', color: '#059669', slotType: 'INSTRUCTION', durationMinutes: 50 },
              { name: 'Linguagem & Comunicação', color: '#0891B2', slotType: 'INSTRUCTION', durationMinutes: 45 },
            ];
        }
      }

      // Generic fallback
      return [
        { name: 'Matemática', color: '#2563EB', slotType: 'INSTRUCTION' },
        { name: 'Língua Portuguesa', color: '#0891B2', slotType: 'INSTRUCTION' },
        { name: 'História & Geografia', color: '#D97706', slotType: 'INSTRUCTION' },
        { name: 'Ciências', color: '#059669', slotType: 'INSTRUCTION' },
      ];
    };

    let totalMinutesWeekly = 0;

    for (const day of weekDays) {
      let currentPointer = startHour;

      if (includeDevotional) {
        const devEnd = this.addMinutes(currentPointer, 15);
        slots.push({
          dayOfWeek: day,
          startTime: currentPointer,
          endTime: devEnd,
          subjectName: 'Devocional Familiar',
          subjectColor: '#4F46E5',
          slotType: 'DEVOTIONAL',
          notes: 'Oração e leitura do texto bíblico matinal',
        });
        totalMinutesWeekly += 15;
        currentPointer = devEnd;
      }

      const subjects = getDailySubjects(day);
      for (const subj of subjects) {
        const duration = subj.durationMinutes || defaultDuration;
        const subjEnd = this.addMinutes(currentPointer, duration);
        slots.push({
          dayOfWeek: day,
          startTime: currentPointer,
          endTime: subjEnd,
          subjectName: subj.name,
          subjectColor: subj.color,
          slotType: subj.slotType,
          notes: subj.notes,
        });
        totalMinutesWeekly += duration;
        currentPointer = subjEnd;
      }
    }

    const totalInstructionalHoursWeekly = Math.round((totalMinutesWeekly / 60) * 10) / 10;

    return {
      slots,
      pedagogicalRationale: rationale,
      totalInstructionalHoursWeekly,
    };
  }

  async applySuggestedRoutine(
    familyId: string,
    input: ApplySuggestedRoutineDto,
  ): Promise<ScheduleSlotResponseDto[]> {
    if (input.replaceExisting) {
      await this.prisma.weeklyScheduleSlot.deleteMany({
        where: {
          familyId,
          ...(input.learnerId ? { learnerId: input.learnerId } : {}),
          ...(input.academicYearId ? { academicYearId: input.academicYearId } : {}),
        },
      });
    }

    const subjectCache = new Map<string, any>();
    const createdSlots: ScheduleSlotResponseDto[] = [];

    for (const slot of input.slots) {
      const normalized = slot.subjectName.trim().toLowerCase();
      let subject = subjectCache.get(normalized);

      if (!subject) {
        subject = await this.prisma.subject.findFirst({
          where: {
            familyId,
            name: { equals: slot.subjectName.trim(), mode: 'insensitive' },
          },
        });

        if (!subject) {
          subject = await this.prisma.subject.create({
            data: {
              familyId,
              name: slot.subjectName.trim(),
              color: slot.subjectColor || '#3B82F6',
            },
          });
        }
        subjectCache.set(normalized, subject);
      }

      const created = await this.prisma.weeklyScheduleSlot.create({
        data: {
          familyId,
          academicYearId: input.academicYearId ?? null,
          subjectId: subject?.id ?? null,
          learnerId: input.learnerId ?? null,
          dayOfWeek: slot.dayOfWeek as DayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: slot.subjectName,
          description: slot.notes ?? null,
          color: slot.subjectColor,
        },
        include: {
          subject: true,
          learner: true,
        },
      });

      const learnerName = created.learner
        ? created.learner.preferredName ||
          (created.learner.firstName + (created.learner.lastName ? ' ' + created.learner.lastName : ''))
        : null;

      const entity = new ScheduleSlotEntity(
        created.id,
        created.familyId,
        created.academicYearId ?? null,
        created.subjectId ?? null,
        created.learnerId ?? null,
        created.dayOfWeek as DayOfWeek,
        created.startTime,
        created.endTime,
        created.title,
        created.description ?? null,
        created.location ?? null,
        created.color ?? null,
        created.createdAt,
        created.updatedAt,
        created.subject?.name ?? null,
        learnerName,
      );

      createdSlots.push(entity.toResponseDto());
    }

    return createdSlots;
  }
}
