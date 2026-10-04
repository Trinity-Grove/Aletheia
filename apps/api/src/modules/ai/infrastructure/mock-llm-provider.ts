import { Injectable } from '@nestjs/common';
import type {
  LlmGenerationOptions,
  LlmGenerationResult,
  LlmProvider,
} from '../domain/llm-provider.interface.js';

@Injectable()
export class MockLlmProvider implements LlmProvider {
  readonly name = 'MOCK';

  async generateDraft(prompt: string, _options?: LlmGenerationOptions): Promise<LlmGenerationResult> {
    const startTime = Date.now();

    const topicMatch = prompt.match(/sobre ([\w\sãõáéíóúâêôç]+)/i);
    const matchedGroup = topicMatch?.[1];
    const topic = matchedGroup ? matchedGroup.trim() : 'Ciências da Natureza';

    const mockContent = {
      title: `Plano de Aula: ${topic}`,
      summary: `Exploração formativa e investigativa sobre ${topic}, focando em observação ativa, narrativa e registro no diário.`,
      materials: ['Caderno da Natureza', 'Lápis de cor', 'Amostras para observação'],
      steps: [
        {
          order: 1,
          title: 'Introdução e Conexão',
          durationMinutes: 10,
          instructions: `Apresentar o tema ${topic} através de uma pergunta investigativa e recapitulação do conhecimento prévio.`,
          narrationPrompt: `O que você já reparou no cotidiano sobre ${topic}?`,
        },
        {
          order: 2,
          title: 'Leitura Viva e Prática',
          durationMinutes: 20,
          instructions: 'Leitura de um trecho de livro vivo ou demonstração prática dos conceitos principais.',
          narrationPrompt: 'Explique com suas palavras o que aconteceu na demonstração.',
        },
        {
          order: 3,
          title: 'Registro e Narração',
          durationMinutes: 15,
          instructions: 'Desenho e resumo oral com registro no caderno da lição.',
        },
      ],
      assessmentObservations: 'Observe o engajamento na narração e o capricho no registro gráfico.',
    };

    const text = JSON.stringify(mockContent, null, 2);
    const promptTokens = Math.max(10, Math.ceil(prompt.length / 4));
    const completionTokens = Math.max(20, Math.ceil(text.length / 4));

    return {
      text,
      parsedJson: mockContent,
      promptTokens,
      completionTokens,
      model: 'mock-deterministic',
      provider: 'MOCK',
      durationMs: Math.max(1, Date.now() - startTime),
    };
  }
}
