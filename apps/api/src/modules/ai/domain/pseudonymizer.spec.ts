import { PseudonymizationService } from './pseudonymizer.js';

describe('PseudonymizationService', () => {
  let service: PseudonymizationService;

  beforeEach(() => {
    service = new PseudonymizationService();
  });

  describe('createSession and mask', () => {
    it('masks learnerName and familyName in text', () => {
      const session = service.createSession({
        learnerName: 'João Silva',
        familyName: 'Silva Sauro',
      });

      const masked = session.mask('O aluno João Silva da família Silva Sauro participou da aula.');
      expect(masked).toBe('O aluno [Aluno 1] da família [Família 1] participou da aula.');
    });

    it('masks multiple occurrences of learner name', () => {
      const session = service.createSession({
        learnerName: 'Maria',
      });

      const masked = session.mask('Maria leu o livro e Maria explicou a história.');
      expect(masked).toBe('[Aluno 1] leu o livro e [Aluno 1] explicou a história.');
    });

    it('leaves text unchanged if target identifiers are absent', () => {
      const session = service.createSession({
        learnerName: 'Lucas',
        familyName: 'Oliveira',
      });

      const text = 'Nenhuma menção aqui.';
      expect(session.mask(text)).toBe(text);
    });

    it('handles context without familyName', () => {
      const session = service.createSession({
        learnerName: 'Ana',
      });

      const masked = session.mask('Ana fez a tarefa da Família Silva.');
      expect(masked).toBe('[Aluno 1] fez a tarefa da Família Silva.');
    });
  });

  describe('rehydrate', () => {
    it('rehydrates masked strings back to original values', () => {
      const session = service.createSession({
        learnerName: 'João Silva',
        familyName: 'Silva Sauro',
      });

      const restored = session.rehydrate('Parabéns [Aluno 1] e [Família 1]!');
      expect(restored).toBe('Parabéns João Silva e Silva Sauro!');
    });

    it('rehydrates nested objects and arrays recursively', () => {
      const session = service.createSession({
        learnerName: 'Ester',
        familyName: 'Macedo',
      });

      const payload = {
        title: 'Lição para [Aluno 1]',
        metadata: {
          familyTag: '[Família 1]',
          score: 10,
          completed: true,
          notes: null,
        },
        participants: ['[Aluno 1]', 'Outro Aluno'],
        steps: [
          {
            order: 1,
            instruction: 'Acompanhar [Aluno 1] na leitura viva.',
          },
        ],
      };

      const rehydrated = session.rehydrate(payload);

      expect(rehydrated).toEqual({
        title: 'Lição para Ester',
        metadata: {
          familyTag: 'Macedo',
          score: 10,
          completed: true,
          notes: null,
        },
        participants: ['Ester', 'Outro Aluno'],
        steps: [
          {
            order: 1,
            instruction: 'Acompanhar Ester na leitura viva.',
          },
        ],
      });
    });

    it('preserves primitive values and null/undefined unchanged', () => {
      const session = service.createSession({
        learnerName: 'Lucas',
      });

      expect(session.rehydrate(42)).toBe(42);
      expect(session.rehydrate(true)).toBe(true);
      expect(session.rehydrate(null)).toBeNull();
      expect(session.rehydrate(undefined)).toBeUndefined();
    });

    it('guarantees round-trip masking and rehydration consistency', () => {
      const session = service.createSession({
        learnerName: 'Benjamim',
        familyName: 'Albuquerque',
      });

      const original = 'Benjamim e a família Albuquerque concluíram os objetivos.';
      const masked = session.mask(original);
      expect(masked).not.toContain('Benjamim');
      expect(masked).not.toContain('Albuquerque');
      expect(session.rehydrate(masked)).toBe(original);
    });
  });
});
