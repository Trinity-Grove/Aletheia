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

  it('correctly serializes Date instances to ISO strings consistently', () => {
    const date = new Date('2026-09-30T12:00:00.000Z');
    const docWithDate = {
      createdAt: date,
      name: 'Pack with Date',
    };
    const docWithString = {
      createdAt: '2026-09-30T12:00:00.000Z',
      name: 'Pack with Date',
    };

    expect(canonicalJsonStringify(docWithDate)).toBe(canonicalJsonStringify(docWithString));
    expect(calculatePackChecksum(docWithDate)).toBe(calculatePackChecksum(docWithString));
  });

  it('only filters out checksumSha256 at the root level and retains nested checksumSha256', () => {
    const doc = {
      checksumSha256: 'root-hash-to-ignore',
      nested: {
        checksumSha256: 'nested-hash-to-keep',
      },
    };

    const serialized = canonicalJsonStringify(doc);
    expect(serialized).not.toContain('root-hash-to-ignore');
    expect(serialized).toContain('nested-hash-to-keep');
  });
});
