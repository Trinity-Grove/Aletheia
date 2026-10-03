export interface ScanViolation {
  path: string;
  pattern: string;
  match: string;
}

export interface ScanResult {
  safe: boolean;
  violations: ScanViolation[];
}

const INJECTION_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: 'IGNORE_PREVIOUS_INSTRUCTIONS',
    regex: /\bignore\s+(all\s+)?(previous|above|prior)\s+(instructions|directions|prompts)\b/i,
  },
  {
    name: 'DISREGARD_INSTRUCTIONS',
    regex: /\bdisregard\s+(all\s+)?(previous|above|prior)\s+(instructions|directions|prompts)\b/i,
  },
  {
    name: 'FORGET_INSTRUCTIONS',
    regex: /\bforget\s+(all\s+)?(previous|above|prior)\s+(instructions|context)\b/i,
  },
  {
    name: 'ACT_AS_UNRESTRICTED',
    regex: /\b(you\s+are\s+now|act\s+as)\s+(unrestricted|in\s+developer\s+mode|dan|jailbroken)\b/i,
  },
  {
    name: 'SYSTEM_PROMPT_OVERRIDE',
    regex: /\bsystem\s+prompt\s+override\b/i,
  },
  {
    name: 'CHATML_TOKEN',
    regex: /<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>/i,
  },
  {
    name: 'LLAMA_DELIMITER',
    regex: /\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>/i,
  },
  {
    name: 'SIMULATED_ROLE_DELIMITER',
    regex: /(?:^|\n)\s*###\s*(?:System|Human|Assistant)\s*:/i,
  },
];

export class PromptInjectionScanner {
  static scan(data: unknown): ScanResult {
    const violations: ScanViolation[] = [];
    PromptInjectionScanner.traverse(data, '$', violations);
    return {
      safe: violations.length === 0,
      violations,
    };
  }

  private static traverse(value: unknown, path: string, violations: ScanViolation[]): void {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      for (const pattern of INJECTION_PATTERNS) {
        const match = value.match(pattern.regex);
        if (match) {
          violations.push({
            path,
            pattern: pattern.name,
            match: match[0],
          });
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        PromptInjectionScanner.traverse(item, `${path}[${index}]`, violations);
      });
      return;
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
      for (const [key, prop] of Object.entries(value as Record<string, unknown>)) {
        PromptInjectionScanner.traverse(prop, `${path}.${key}`, violations);
      }
    }
  }
}
