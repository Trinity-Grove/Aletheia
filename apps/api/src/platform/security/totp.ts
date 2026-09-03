import { createHash, randomBytes } from 'node:crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';

const APP_NAME = 'Aletheia';
const RECOVERY_CODE_LENGTH = 8;
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // disambiguated charset
// ±1 30s step window (previous/current/next), matching standard client
// clock-skew tolerance.
const TOTP_EPOCH_TOLERANCE_SECONDS = 30;

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildOtpauthUri(email: string, secret: string): string {
  return generateURI({ issuer: APP_NAME, label: email, secret });
}

export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    const result = verifySync({
      secret,
      token,
      epochTolerance: TOTP_EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export function generateRecoveryCodes(count: number): string[] {
  const codes: string[] = [];
  const charsetLength = RECOVERY_CODE_ALPHABET.length;

  for (let i = 0; i < count; i += 1) {
    const bytes = randomBytes(RECOVERY_CODE_LENGTH);
    let code = '';
    for (let j = 0; j < RECOVERY_CODE_LENGTH; j += 1) {
      const byte = bytes[j];
      const char = byte === undefined ? '' : RECOVERY_CODE_ALPHABET[byte % charsetLength];
      code += char ?? '';
    }
    codes.push(code);
  }

  return codes;
}

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, '');
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

export function formatRecoveryCode(code: string): string {
  const normalized = normalizeRecoveryCode(code);
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}