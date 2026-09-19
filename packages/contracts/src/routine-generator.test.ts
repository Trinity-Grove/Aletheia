import { describe, expect, it } from 'vitest';
import {
  applySuggestedRoutineSchema,
  learningBlockSchema,
  pedagogicalModelCatalogEntrySchema,
  suggestRoutineInputSchema,
  suggestedRoutineResponseSchema,
  suggestedRoutineSlotSchema,
} from './index.js';

describe('Routine Generator & Learning Block Schemas', () => {
  describe('pedagogicalGuideSchema & learningBlockSchema', () => {
    it('validates a complete learning block with pedagogical guide', () => {
      const validBlock = {
        blockIndex: 1,
        title: 'Bloco 1: Fundamentos & Hábitos Iniciais',
        pedagogicalGuide: {
          primaryMethod: 'Narração Oral Charlotte Mason',
          recommendedPacing: '2 a 3 lições curtas de 15 a 20 minutos por semana',
          parentInstructions:
            'Peça à criança para recontar a história imediatamente após a leitura, sem interromper para correções secundárias.',
          suggestedResources: ['Livros vivos', 'Caderno da natureza', 'Lápis de cor aquareláveis'],
        },
        objectives: [
          'Desenvolver atenção sustentada por 15 minutos em leitura em voz alta',
          'Narrar oralmente um episódio histórico ou conto moral com início, meio e fim',
        ],
      };

      const parsed = learningBlockSchema.safeParse(validBlock);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.blockIndex).toBe(1);
        expect(parsed.data.pedagogicalGuide.primaryMethod).toContain('Narração Oral');
        expect(parsed.data.objectives).toHaveLength(2);
      }
    });

    it('rejects invalid blockIndex <= 0', () => {
      const invalidBlock = {
        blockIndex: 0,
        title: 'Bloco Inválido',
        pedagogicalGuide: {
          primaryMethod: 'Método',
          recommendedPacing: 'Ritmo',
          parentInstructions: 'Instruções',
        },
        objectives: [],
      };

      const parsed = learningBlockSchema.safeParse(invalidBlock);
      expect(parsed.success).toBe(false);
    });
  });

  describe('suggestRoutineInputSchema', () => {
    it('applies standard defaults when optional fields are omitted', () => {
      const parsed = suggestRoutineInputSchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.startHour).toBe('08:30');
        expect(parsed.data.lessonDurationMinutes).toBe(25);
        expect(parsed.data.includeDevotional).toBe(true);
        expect(parsed.data.fridaysForProjects).toBe(true);
        expect(parsed.data.pedagogicalModelCode).toBe('CHARLOTTE_MASON');
      }
    });

    it('validates custom input within allowed boundaries', () => {
      const parsed = suggestRoutineInputSchema.safeParse({
        learnerId: '11111111-1111-4111-8111-111111111111',
        pedagogicalModelCode: 'CLASSICAL',
        startHour: '08:00',
        lessonDurationMinutes: 45,
        includeDevotional: true,
        fridaysForProjects: false,
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.lessonDurationMinutes).toBe(45);
        expect(parsed.data.fridaysForProjects).toBe(false);
      }
    });

    it('rejects duration outside range (15 to 60 minutes)', () => {
      expect(suggestRoutineInputSchema.safeParse({ lessonDurationMinutes: 10 }).success).toBe(false);
      expect(suggestRoutineInputSchema.safeParse({ lessonDurationMinutes: 90 }).success).toBe(false);
    });
  });

  describe('suggestedRoutineSlotSchema & suggestedRoutineResponseSchema', () => {
    it('validates a routine slot and full response', () => {
      const validSlot = {
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '08:50',
        subjectName: 'Devocional Familiar',
        subjectColor: '#4F46E5',
        slotType: 'DEVOTIONAL',
        notes: 'Oração e leitura do texto bíblico matinal',
      };

      const slotParsed = suggestedRoutineSlotSchema.safeParse(validSlot);
      expect(slotParsed.success).toBe(true);

      const responsePayload = {
        slots: [validSlot],
        pedagogicalRationale:
          'Rotina calibrada para o modelo Clássico com devocional matinal e blocos concentrados.',
        totalInstructionalHoursWeekly: 15.5,
      };

      const respParsed = suggestedRoutineResponseSchema.safeParse(responsePayload);
      expect(respParsed.success).toBe(true);
      if (respParsed.success) {
        expect(respParsed.data.slots).toHaveLength(1);
        expect(respParsed.data.totalInstructionalHoursWeekly).toBe(15.5);
      }
    });
  });

  describe('applySuggestedRoutineSchema', () => {
    it('validates payload to persist suggested slots', () => {
      const payload = {
        learnerId: '11111111-1111-4111-8111-111111111111',
        academicYearId: '22222222-2222-4222-8222-222222222222',
        replaceExisting: true,
        slots: [
          {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '09:30',
            subjectName: 'Matemática',
            subjectColor: '#2563EB',
            slotType: 'INSTRUCTION',
          },
        ],
      };

      const parsed = applySuggestedRoutineSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.replaceExisting).toBe(true);
        expect(parsed.data.slots).toHaveLength(1);
      }
    });
  });

  describe('pedagogicalModelCatalogEntrySchema with subjects preview', () => {
    it('allows optional subjects list with starterObjectives for transparent previews', () => {
      const entry = {
        code: 'CHARLOTTE_MASON',
        name: 'Charlotte Mason',
        description: 'Educação baseada em hábitos e livros vivos.',
        subjects: [
          {
            name: 'História Viva',
            color: '#16A34A',
            icon: 'book-open',
            description: 'Narrativas históricas e biografias.',
            starterObjectives: ['Compreender a linha do tempo antiga', 'Narrar vida de um patriarca'],
          },
        ],
      };

      const parsed = pedagogicalModelCatalogEntrySchema.safeParse(entry);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.subjects).toHaveLength(1);
        expect(parsed.data.subjects?.[0]?.starterObjectives).toHaveLength(2);
      }
    });
  });
});
