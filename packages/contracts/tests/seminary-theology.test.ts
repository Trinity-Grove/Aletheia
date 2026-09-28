import { describe, expect, it } from 'vitest';
import {
  SEMINARY_EVIDENCE_TYPE_CODES,
  SeminaryEvidenceTypeCodeSchema,
  SeminaryRubricCriterionSchema,
  SeminaryTheologyRubricSchema,
  SEMINARY_THEOLOGY_RUBRIC_DEFINITION,
  SEMINARY_THEOLOGY_COMPETENCIES,
  SeminaryCompetencyCodeSchema,
  SeminaryDisciplineSchema,
  SeminaryCycleSchema,
  SeminaryTheologyPackPayloadSchema,
  SEMINARY_DISCIPLINES_METADATA,
  SEMINARY_CYCLES_METADATA,
  SEMINARY_THEOLOGY_PACK_PAYLOAD,
} from '../src/seminary-theology.js';

describe('Seminary Theology Contracts', () => {
  describe('Seminary Evidence Types', () => {
    it('validates all 5 seminary evidence type codes', () => {
      expect(SEMINARY_EVIDENCE_TYPE_CODES).toHaveLength(5);
      expect(SeminaryEvidenceTypeCodeSchema.parse('THEOLOGICAL_ESSAY')).toBe('THEOLOGICAL_ESSAY');
      expect(SeminaryEvidenceTypeCodeSchema.parse('EXEGESIS_PAPER')).toBe('EXEGESIS_PAPER');
      expect(SeminaryEvidenceTypeCodeSchema.parse('BOOK_REVIEW')).toBe('BOOK_REVIEW');
      expect(SeminaryEvidenceTypeCodeSchema.parse('ORAL_DEFENSE')).toBe('ORAL_DEFENSE');
      expect(SeminaryEvidenceTypeCodeSchema.parse('THEOLOGICAL_DEBATE')).toBe('THEOLOGICAL_DEBATE');
    });

    it('rejects an invalid evidence type code', () => {
      expect(() => SeminaryEvidenceTypeCodeSchema.parse('INVALID_EVIDENCE_TYPE')).toThrow();
    });
  });

  describe('Seminary Theology Rubric', () => {
    it('validates seminary theology rubric structure with 4 criteria', () => {
      const validRubric = {
        code: 'THEOLOGY_ACADEMIC_RIGOR_RUBRIC',
        name: 'Rubrica de Rigor Teológico e Exegético',
        description: 'Avaliação analítica de produções teológicas acadêmicas com 4 critérios ponderados',
        criteria: [
          { code: 'EXEGETICAL_DEPTH', name: 'Fidelidade Exegética', weight: 0.3, description: 'Análise do texto bíblico no contexto histórico-gramatical e canônico com uso de línguas originais' },
          { code: 'SYSTEMATIC_COHERENCE', name: 'Coerência Sistemática', weight: 0.25, description: 'Articulação lógica e orgânica das doutrinas sem contradições internas' },
          { code: 'HISTORICAL_AWARENESS', name: 'Consciência Histórica e Patrística', weight: 0.25, description: 'Citação direta de credos, concílios e fontes primárias históricas' },
          { code: 'ARGUMENTATIVE_RIGOR', name: 'Rigor Argumentativo e Caridade', weight: 0.2, description: 'Estrutura formal, bibliografia e princípio da caridade hermenêutica' },
        ],
      };
      const parsed = SeminaryTheologyRubricSchema.parse(validRubric);
      expect(parsed.criteria).toHaveLength(4);
      expect(parsed.code).toBe('THEOLOGY_ACADEMIC_RIGOR_RUBRIC');
    });

    it('validates that SEMINARY_THEOLOGY_RUBRIC_DEFINITION conforms to schema and criteria weights sum to 1.0', () => {
      const parsed = SeminaryTheologyRubricSchema.parse(SEMINARY_THEOLOGY_RUBRIC_DEFINITION);
      expect(parsed.code).toBe('THEOLOGY_ACADEMIC_RIGOR_RUBRIC');
      expect(parsed.criteria).toHaveLength(4);

      const totalWeight = parsed.criteria.reduce((sum, c) => sum + c.weight, 0);
      expect(Math.round(totalWeight * 100) / 100).toBe(1.0);

      const criterionCodes = parsed.criteria.map((c) => c.code);
      expect(criterionCodes).toEqual([
        'EXEGETICAL_DEPTH',
        'SYSTEMATIC_COHERENCE',
        'HISTORICAL_AWARENESS',
        'ARGUMENTATIVE_RIGOR',
      ]);
    });

    it('rejects rubric with empty criteria list or invalid weight', () => {
      expect(() =>
        SeminaryTheologyRubricSchema.parse({
          code: 'EMPTY_RUBRIC',
          name: 'Vazia',
          criteria: [],
        }),
      ).toThrow();

      expect(() =>
        SeminaryRubricCriterionSchema.parse({
          code: 'INVALID_WEIGHT',
          name: 'Inválido',
          weight: 1.5,
        }),
      ).toThrow();
    });
  });

  describe('Seminary Theology Competencies', () => {
    it('validates all 24 required seminary competencies from Issue #95/#176', () => {
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toHaveLength(24);
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.BIBLIOLOGY_CANON');
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.CHRISTOLOGY_HYPOSTATIC_UNION');
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.ESCHATOLOGY_MILLENNIUM');
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.APOCALYPSE_MODELS');
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.PATRISTICS');
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.HISTORIC_COUNCILS');
      expect(SEMINARY_THEOLOGY_COMPETENCIES).toContain('THEO.ADV.MISSIOLOGY');

      for (const comp of SEMINARY_THEOLOGY_COMPETENCIES) {
        expect(SeminaryCompetencyCodeSchema.parse(comp)).toBe(comp);
      }
    });

    it('rejects invalid competency code', () => {
      expect(() => SeminaryCompetencyCodeSchema.parse('THEO.INVALID_CODE')).toThrow();
    });
  });

  describe('Seminary Disciplines & Curriculum Pack Payload', () => {
    it('validates that SEMINARY_DISCIPLINES_METADATA has exactly 24 disciplines spanning cycles 1 to 4', () => {
      expect(SEMINARY_DISCIPLINES_METADATA).toHaveLength(24);

      const cycle1 = SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 1);
      const cycle2 = SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 2);
      const cycle3 = SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 3);
      const cycle4 = SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 4);

      expect(cycle1).toHaveLength(4);
      expect(cycle2).toHaveLength(6);
      expect(cycle3).toHaveLength(5);
      expect(cycle4).toHaveLength(9);

      for (const discipline of SEMINARY_DISCIPLINES_METADATA) {
        const parsed = SeminaryDisciplineSchema.parse(discipline);
        expect(parsed.topics.length).toBeGreaterThan(0);
        expect(parsed.primaryReadings.length).toBeGreaterThan(0);
        expect(parsed.suggestedEvidenceTypes.length).toBeGreaterThan(0);
      }
    });

    it('includes Eschatology comparative schools and Apocalypse models in cycle 3', () => {
      const cycle3 = SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 3);
      const codes = cycle3.map((d) => d.competencyCode);

      expect(codes).toContain('THEO.ADV.ESCHATOLOGY_MILLENNIUM');
      expect(codes).toContain('THEO.ADV.APOCALYPSE_MODELS');

      const eschatology = cycle3.find((d) => d.competencyCode === 'THEO.ADV.ESCHATOLOGY_MILLENNIUM')!;
      expect(eschatology.topics.some((t) => t.includes('Pré-Milenismo') || t.includes('Amilenismo'))).toBe(true);

      const apocalypse = cycle3.find((d) => d.competencyCode === 'THEO.ADV.APOCALYPSE_MODELS')!;
      expect(apocalypse.topics.some((t) => t.includes('Preterista') || t.includes('Futurista'))).toBe(true);
    });

    it('validates SEMINARY_CYCLES_METADATA structure', () => {
      expect(SEMINARY_CYCLES_METADATA).toHaveLength(4);
      for (const cycle of SEMINARY_CYCLES_METADATA) {
        const parsed = SeminaryCycleSchema.parse(cycle);
        expect(parsed.disciplines.length).toBeGreaterThan(0);
      }
    });

    it('validates SEMINARY_THEOLOGY_PACK_PAYLOAD conforming to SeminaryTheologyPackPayloadSchema', () => {
      const parsed = SeminaryTheologyPackPayloadSchema.parse(SEMINARY_THEOLOGY_PACK_PAYLOAD);
      expect(parsed.code).toBe('ADVANCED_SEMINARY_THEOLOGY');
      expect(parsed.cycles).toHaveLength(4);

      const totalDisciplines = parsed.cycles.reduce((acc, c) => acc + c.disciplines.length, 0);
      expect(totalDisciplines).toBe(24);
    });
  });
});
