import { createHmac, randomBytes } from 'node:crypto';

// A self-contained, faithful RFC 6238 implementation used ONLY by the
// integration/e2e test suites. Jest cannot load the real `otplib@13` (its
// runtime deps — @scure/base and friends — are pure ESM and untransformable
// by ts-jest), but the real package works fine under Node's CJS runtime.
//
// This module is wired up via `moduleNameMapper` (`^otplib$` -> this file) so
// the API boots under Jest while still performing genuine TOTP verification
// against the real stored secret. It mirrors otplib's defaults: Base32
// secrets, SHA-1, 6 digits, 30s period.

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD_SECONDS = 30;
const DIGITS = 6;

function base32Encode(buf: Buffer): string {
  let bits = '';
  for (const byte of buf) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

function base32Decode(input: string): Buffer {
  let bits = '';
  for (const char of input.toUpperCase()) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpAt(secret: string, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

export function generateURI(options: {
  issuer: string;
  label: string;
  secret: string;
}): string {
  const { issuer, label, secret } = options;
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

export function verifySync(options: {
  secret: string;
  token: string;
  epochTolerance?: number;
}): { valid: boolean } {
  const epoch = Math.floor(Date.now() / 1000);
  const toleranceSteps = Math.max(0, Math.floor((options.epochTolerance ?? 0) / PERIOD_SECONDS));
  const counter = Math.floor(epoch / PERIOD_SECONDS);

  for (let delta = -toleranceSteps; delta <= toleranceSteps; delta += 1) {
    if (totpAt(options.secret, counter + delta) === options.token) {
      return { valid: true };
    }
  }
  return { valid: false };
}
