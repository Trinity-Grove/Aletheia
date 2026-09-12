import { describe, expect, it } from 'vitest';
import {
  createBibleTranslationDefinitionSchema,
  comparePassageQuerySchema,
} from './bible-translation-definition.js';

describe('Bible Translation Definition Contracts', () => {
  it('validates a minimal translation with defaults', () => {
    const parsed = createBibleTranslationDefinitionSchema.parse({
      code: 'NVI',
      name: 'Nova Versão Internacional',
      language: 'pt',
      youVersionId: '129',
    });
    expect(parsed.status).toBe('DRAFT');
  });

  it('accepts a free-form translationPhilosophy, not a closed enum', () => {
    const parsed = createBibleTranslationDefinitionSchema.parse({
      code: 'ARA',
      name: 'Almeida Revista e Atualizada',
      language: 'pt',
      youVersionId: '1608',
      translationPhilosophy: 'A_PHILOSOPHY_NOT_YET_NAMED',
    });
    expect(parsed.translationPhilosophy).toBe('A_PHILOSOPHY_NOT_YET_NAMED');
  });

  it('accepts publisher and licensing notes', () => {
    const parsed = createBibleTranslationDefinitionSchema.parse({
      code: 'ESV',
      name: 'English Standard Version',
      language: 'en',
      youVersionId: '59',
      publisher: 'Crossway',
      licensingNotes: 'Direitos reservados; uso mediante licenciamento.',
    });
    expect(parsed.publisher).toBe('Crossway');
  });

  it('rejects a lowercase code', () => {
    expect(() =>
      createBibleTranslationDefinitionSchema.parse({
        code: 'nvi',
        name: 'x',
        language: 'pt',
        youVersionId: '129',
      }),
    ).toThrow();
  });

  it('requires a youVersionId', () => {
    expect(() =>
      createBibleTranslationDefinitionSchema.parse({
        code: 'NVI',
        name: 'x',
        language: 'pt',
      }),
    ).toThrow();
  });
});

describe('Compare Passage Query Contract', () => {
  it('splits and normalizes a comma-separated translationCodes list', () => {
    const parsed = comparePassageQuerySchema.parse({
      reference: 'John 3:16',
      translationCodes: 'nvi, ara ,esv',
    });
    expect(parsed.translationCodes).toEqual(['NVI', 'ARA', 'ESV']);
  });

  it('rejects an empty reference', () => {
    expect(() => comparePassageQuerySchema.parse({ reference: '', translationCodes: 'NVI' })).toThrow();
  });
});
