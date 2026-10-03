import { MockLlmProvider } from './mock-llm-provider.js';

describe('MockLlmProvider', () => {
  let provider: MockLlmProvider;

  beforeEach(() => {
    provider = new MockLlmProvider();
  });

  it('exposes the provider name MOCK', () => {
    expect(provider.name).toBe('MOCK');
  });

  it('generates a deterministic lesson draft with parsed topic from prompt', async () => {
    const result = await provider.generateDraft('Elabore um plano de aula sobre Fotossíntese');

    expect(result.provider).toBe('MOCK');
    expect(result.model).toBe('mock-deterministic');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.promptTokens).toBeGreaterThanOrEqual(10);
    expect(result.completionTokens).toBeGreaterThanOrEqual(20);

    expect(result.parsedJson).toBeDefined();
    expect(result.parsedJson?.title).toBe('Plano de Aula: Fotossíntese');
    expect(result.parsedJson?.summary).toContain('Fotossíntese');
    expect(result.parsedJson?.materials).toEqual([
      'Caderno da Natureza',
      'Lápis de cor',
      'Amostras para observação',
    ]);
    expect(Array.isArray(result.parsedJson?.steps)).toBe(true);
    expect((result.parsedJson?.steps as unknown[]).length).toBe(3);

    const parsedFromText = JSON.parse(result.text);
    expect(parsedFromText).toEqual(result.parsedJson);
  });

  it('falls back to default topic when prompt does not specify one', async () => {
    const result = await provider.generateDraft('Planeje uma atividade prática');

    expect(result.parsedJson?.title).toBe('Plano de Aula: Ciências da Natureza');
    expect(result.parsedJson?.summary).toContain('Ciências da Natureza');
  });

  it('respects optional generation options without errors', async () => {
    const result = await provider.generateDraft('Aula sobre Botânica', {
      temperature: 0.2,
      maxTokens: 500,
      responseFormat: 'json',
      systemPrompt: 'Instruções do sistema',
    });

    expect(result.parsedJson?.title).toBe('Plano de Aula: Botânica');
    expect(result.text).toBeDefined();
  });
});
