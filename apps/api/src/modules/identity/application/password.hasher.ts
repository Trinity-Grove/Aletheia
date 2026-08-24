import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PasswordHasher {
  private readonly keyLength = 64;

  hash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, this.keyLength).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  verify(password: string, combined: string): boolean {
    const [salt, key] = combined.split(':');
    if (!salt || !key) {
      return false;
    }
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = scryptSync(password, salt, this.keyLength);
    if (keyBuffer.length !== derivedBuffer.length) {
      return false;
    }
    return timingSafeEqual(keyBuffer, derivedBuffer);
  }
}
