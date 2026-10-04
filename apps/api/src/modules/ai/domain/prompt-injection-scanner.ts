import { Injectable } from '@nestjs/common';
export interface PromptInjectionViolation {
  path: string;
  pattern: string;
  match: string;
}

export interface PromptInjectionScanResult {
  safe: boolean;
  violations: PromptInjectionViolation[];
}

interface PatternRule {
  name: string;
  regex: RegExp;
}

const INJECTION_PATTERNS: PatternRule[] = [
  {
    name: 'ROLE_DELIMITER_IM_START',
    regex: /<\|im_start\|>/i,
  },
  {
    name: 'ROLE_DELIMITER_IM_END',
    regex: /<\|im_end\|>/i,
  },
  {
    name: 'ROLE_DELIMITER_SYSTEM_HASH',
    regex: /###\s*(System|Human|Assistant|User|Admin):?/i,
  },
  {
    name: 'ROLE_DELIMITER_INST',
    regex: /\[\/?INST\]/i,
  },
  {
    name: 'ROLE_DELIMITER_TAGS',
    regex: /<\|(system|user|assistant)\|>/i,
  },
  {
    name: 'ROLE_DELIMITER_SYS_TAGS',
    regex: /<<\/?SYS>>/i,
  },
  {
    name: 'JAILBREAK_IGNORE_PREVIOUS',
    regex: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  },
  {
    name: 'JAILBREAK_DISREGARD_PREVIOUS',
    regex: /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  },
  {
    name: 'JAILBREAK_FORGET_PREVIOUS',
    regex: /forget\s+(all\s+)?(previous|prior|above)\s+(instructions|rules)/i,
  },
  {
    name: 'JAILBREAK_OVERRIDE_INSTRUCTIONS',
    regex: /override\s+(system|previous)\s+instructions/i,
  },
  {
    name: 'JAILBREAK_DAN_MODE',
    regex: /(do\s+anything\s+now|DAN\s+mode|you\s+are\s+now\s+in\s+developer\s+mode)/i,
  },
  {
    name: 'SYSTEM_PROMPT_OVERRIDE',
    regex: /(new\s+system\s+prompt:|system\s+override:|bypass\s+(safety|content)\s+(filters|rules|guidelines))/i,
  },
];

@Injectable()
export class PromptInjectionScanner {
  static scan(input: unknown, path = ''): PromptInjectionScanResult {
    const violations: PromptInjectionViolation[] = [];

    PromptInjectionScanner.traverse(input, path, violations);

    return {
      safe: violations.length === 0,
      violations,
    };
  }

  private static traverse(
    value: unknown,
    currentPath: string,
    violations: PromptInjectionViolation[],
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      for (const pattern of INJECTION_PATTERNS) {
        const match = pattern.regex.exec(value);
        if (match) {
          violations.push({
            path: currentPath || 'root',
            pattern: pattern.name,
            match: match[0],
          });
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const element = value[i];
        PromptInjectionScanner.traverse(
          element,
          currentPath ? `${currentPath}[${i}]` : `[${i}]`,
          violations,
        );
      }
      return;
    }

    if (typeof value === 'object') {
      for (const [key, propValue] of Object.entries(value)) {
        PromptInjectionScanner.traverse(
          propValue,
          currentPath ? `${currentPath}.${key}` : key,
          violations,
        );
      }
    }
  }
}
