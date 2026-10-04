import { Injectable } from '@nestjs/common';

export interface LearnerIdentityContext {
  learnerName: string;
  familyName?: string;
  ageYears?: number;
  gradeLevel?: string;
}

export class PseudonymizationSession {
  private readonly forwardMap = new Map<string, string>();
  private readonly reverseMap = new Map<string, string>();

  constructor(context: LearnerIdentityContext) {
    if (context.learnerName) {
      this.forwardMap.set(context.learnerName, '[Aluno 1]');
      this.reverseMap.set('[Aluno 1]', context.learnerName);
    }
    if (context.familyName) {
      this.forwardMap.set(context.familyName, '[Família 1]');
      this.reverseMap.set('[Família 1]', context.familyName);
    }
  }

  mask(text: string): string {
    let result = text;
    for (const [real, pseudonym] of this.forwardMap.entries()) {
      result = result.split(real).join(pseudonym);
    }
    return result;
  }

  rehydrate<T>(obj: T): T {
    if (typeof obj === 'string') {
      let result: string = obj;
      for (const [pseudonym, real] of this.reverseMap.entries()) {
        result = result.split(pseudonym).join(real);
      }
      return result as unknown as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.rehydrate(item)) as unknown as T;
    }
    if (obj !== null && typeof obj === 'object') {
      const cloned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        cloned[k] = this.rehydrate(v);
      }
      return cloned as T;
    }
    return obj;
  }
}

@Injectable()
export class PseudonymizationService {
  createSession(context: LearnerIdentityContext): PseudonymizationSession {
    return new PseudonymizationSession(context);
  }
}
