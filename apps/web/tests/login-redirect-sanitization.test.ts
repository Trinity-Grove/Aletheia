import { describe, expect, it } from 'vitest';
import { sanitizeRedirectTarget } from '../app/(auth)/login/page';

describe('sanitizeRedirectTarget', () => {
  it('accepts a plain relative path', () => {
    expect(sanitizeRedirectTarget('/learners')).toBe('/learners');
  });

  it('accepts a relative path with a query string', () => {
    expect(sanitizeRedirectTarget('/records?tab=summary')).toBe('/records?tab=summary');
  });

  it('falls back to / for null or missing values', () => {
    expect(sanitizeRedirectTarget(null)).toBe('/');
    expect(sanitizeRedirectTarget(undefined)).toBe('/');
    expect(sanitizeRedirectTarget('')).toBe('/');
  });

  it('rejects an absolute URL to prevent an open redirect', () => {
    expect(sanitizeRedirectTarget('https://evil.example.com')).toBe('/');
  });

  it('rejects a protocol-relative URL to prevent an open redirect', () => {
    expect(sanitizeRedirectTarget('//evil.example.com')).toBe('/');
  });

  it('rejects a value that does not start with a slash', () => {
    expect(sanitizeRedirectTarget('learners')).toBe('/');
  });
});
