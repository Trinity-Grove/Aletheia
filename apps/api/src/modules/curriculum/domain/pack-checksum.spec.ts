import { calculatePackChecksum, canonicalJsonStringify, verifyPackChecksum } from './pack-checksum.js';

describe('PackChecksum', () => {
  it('generates consistent sha256 checksum irrespective of key order', () => {
    const docA = {
      formatVersion: '1.0.0',
      pack: { code: 'TRIVIUM', version: 1, name: 'Trivium Pack' },
      items: [{ code: 'A', version: 1 }],
    };
    const docB = {
      items: [{ code: 'A', version: 1 }],
      pack: { name: 'Trivium Pack', version: 1, code: 'TRIVIUM' },
      formatVersion: '1.0.0',
    };

    const hashA = calculatePackChecksum(docA);
    const hashB = calculatePackChecksum(docB);

    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
    expect(hashA).toBe(hashB);
  });

  it('produces different hashes when content is modified', () => {
    const docA = { name: 'Original', version: 1 };
    const docB = { name: 'Modified', version: 1 };

    expect(calculatePackChecksum(docA)).not.toBe(calculatePackChecksum(docB));
  });

  it('verifies pack checksum correctly', () => {
    const doc = {
      formatVersion: '1.0.0',
      pack: { code: 'TRIVIUM', version: 1, name: 'Trivium Pack' },
      items: [],
      dependencies: [],
      exportedAt: new Date().toISOString(),
      checksumSha256: '',
    };
    doc.checksumSha256 = calculatePackChecksum(doc);

    expect(verifyPackChecksum(doc as any)).toBe(true);

    const tampered = { ...doc, checksumSha256: 'a'.repeat(64) };
    expect(verifyPackChecksum(tampered as any)).toBe(false);

    const missing = { ...doc, checksumSha256: undefined };
    expect(verifyPackChecksum(missing as any)).toBe(false);
  });
});
