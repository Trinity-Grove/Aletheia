export interface LlmGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  systemPrompt?: string;
}

export interface LlmGenerationResult {
  text: string;
  parsedJson?: Record<string, unknown>;
  promptTokens: number;
  completionTokens: number;
  model: string;
  provider: string;
  durationMs: number;
}

export interface LlmProvider {
  readonly name: string;
  generateDraft(prompt: string, options?: LlmGenerationOptions): Promise<LlmGenerationResult>;
}
