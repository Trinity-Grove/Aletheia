import { describe, expect, it } from 'vitest';
import {
  consentScopeSchema,
  consentActionSchema,
  consentStatusSchema,
  createConsentDefinitionSchema,
  grantConsentSchema,
  revokeConsentSchema,
  updateConsentDefinitionStatusSchema,
} from './consent-definition.js';

describe('Consent Definition Contracts', () => {
  it('validates valid consent definition creation input', () => {
    const valid = {
      code: 'TERMS_OF_SERVICE',
      version: 1,
      scope: 'FAMILY' as const,
      mandatory: true,
      title: 'Termos de Uso da Plataforma',
      content: 'Texto completo dos termos...',
      purposes: ['Acesso ao sistema e processamento de rotinas'],
    };
    const parsed = createConsentDefinitionSchema.parse(valid);
    expect(parsed.code).toBe('TERMS_OF_SERVICE');
    expect(parsed.scope).toBe('FAMILY');
    expect(parsed.mandatory).toBe(true);
  });

  it('applies default values for optional fields during definition creation', () => {
    const minimal = {
      code: 'DATA_PROCESSING',
      title: 'Tratamento de Dados',
      content: 'Texto completo de tratamento de dados...',
      purposes: ['Armazenamento de notas'],
    };
    const parsed = createConsentDefinitionSchema.parse(minimal);
    expect(parsed.version).toBe(1);
    expect(parsed.scope).toBe('FAMILY');
    expect(parsed.mandatory).toBe(false);
  });

  it('rejects invalid scope or missing required fields in definition', () => {
    expect(() =>
      createConsentDefinitionSchema.parse({
        code: 'INVALID',
        scope: 'UNKNOWN_SCOPE',
        title: 'Title',
        content: 'Content',
        purposes: [],
      }),
    ).toThrow();

    expect(() =>
      createConsentDefinitionSchema.parse({
        code: 'invalid_code_lowercase',
        title: 'Title',
        content: 'Content at least 10 chars',
        purposes: ['Purpose 1'],
      }),
    ).toThrow();
  });

  it('validates grant consent payload', () => {
    const valid = {
      consentDefinitionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      learnerId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    };
    const parsed = grantConsentSchema.parse(valid);
    expect(parsed.consentDefinitionId).toBe(valid.consentDefinitionId);
    expect(parsed.learnerId).toBe(valid.learnerId);
  });

  it('rejects invalid uuid in grant consent payload', () => {
    expect(() =>
      grantConsentSchema.parse({
        consentDefinitionId: 'not-a-uuid',
      }),
    ).toThrow();
  });

  it('validates revoke consent payload without learnerId for family scope', () => {
    const valid = {
      consentDefinitionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };
    const parsed = revokeConsentSchema.parse(valid);
    expect(parsed.consentDefinitionId).toBe(valid.consentDefinitionId);
    expect(parsed.learnerId).toBeUndefined();
  });

  it('validates status transition payload', () => {
    const valid = { status: 'PUBLISHED' };
    const parsed = updateConsentDefinitionStatusSchema.parse(valid);
    expect(parsed.status).toBe('PUBLISHED');
  });

  it('rejects invalid status in status transition payload', () => {
    expect(() =>
      updateConsentDefinitionStatusSchema.parse({
        status: 'NON_EXISTENT_STATUS',
      }),
    ).toThrow();
  });

  it('validates consent enum schemas correctly', () => {
    expect(consentScopeSchema.parse('FAMILY')).toBe('FAMILY');
    expect(consentScopeSchema.parse('LEARNER')).toBe('LEARNER');
    expect(() => consentScopeSchema.parse('OTHER')).toThrow();

    expect(consentActionSchema.parse('GRANTED')).toBe('GRANTED');
    expect(consentActionSchema.parse('REVOKED')).toBe('REVOKED');
    expect(() => consentActionSchema.parse('DENIED')).toThrow();

    expect(consentStatusSchema.parse('ACTIVE')).toBe('ACTIVE');
    expect(consentStatusSchema.parse('OUTDATED')).toBe('OUTDATED');
    expect(consentStatusSchema.parse('REVOKED')).toBe('REVOKED');
    expect(consentStatusSchema.parse('PENDING')).toBe('PENDING');
    expect(() => consentStatusSchema.parse('UNKNOWN')).toThrow();
  });
});
