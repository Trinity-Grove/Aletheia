import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

function toBuffer(keyHex: string): Buffer {
  return Buffer.from(keyHex, 'hex');
}

export class TotpSecretCipher {
  constructor(private readonly keyHex: string) {}

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, toBuffer(this.keyHex), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(encoded: string): string {
    const parts = encoded.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted secret.');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, toBuffer(this.keyHex), iv);
    decipher.setAuthTag(authTag);

    // GCM throws on tamper (invalid auth tag) — it never returns garbage.
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }
}