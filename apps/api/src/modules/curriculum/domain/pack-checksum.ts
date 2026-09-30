import { createHash } from 'node:crypto';
import type { CurriculumPackExportDocument } from '@aletheia/contracts';

export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJsonStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys
    .filter((k) => k !== 'checksumSha256' && (obj as Record<string, unknown>)[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalJsonStringify((obj as Record<string, unknown>)[k])}`);
  return '{' + entries.join(',') + '}';
}

export function calculatePackChecksum(doc: unknown): string {
  const canonical = canonicalJsonStringify(doc);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function verifyPackChecksum(doc: CurriculumPackExportDocument): boolean {
  if (!doc.checksumSha256) {
    return false;
  }
  return doc.checksumSha256.toLowerCase() === calculatePackChecksum(doc).toLowerCase();
}
