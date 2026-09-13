import { parseScriptureReference } from './scripture-reference.js';

describe('parseScriptureReference', () => {
  describe('single verse', () => {
    it('parses an English full book name', () => {
      expect(parseScriptureReference('John 3:16')).toEqual({ usfm: 'JHN.3.16' });
    });

    it('parses a Portuguese full book name with an accent', () => {
      expect(parseScriptureReference('João 3:16')).toEqual({ usfm: 'JHN.3.16' });
    });

    it('parses the same Portuguese book name without the accent', () => {
      expect(parseScriptureReference('Joao 3:16')).toEqual({ usfm: 'JHN.3.16' });
    });

    it('parses a common abbreviation', () => {
      expect(parseScriptureReference('Jhn 3:16')).toEqual({ usfm: 'JHN.3.16' });
    });

    it('is case-insensitive', () => {
      expect(parseScriptureReference('JOÃO 3:16')).toEqual({ usfm: 'JHN.3.16' });
      expect(parseScriptureReference('john 3:16')).toEqual({ usfm: 'JHN.3.16' });
    });

    it('accepts a period as the chapter/verse separator', () => {
      expect(parseScriptureReference('John 3.16')).toEqual({ usfm: 'JHN.3.16' });
    });

    it('tolerates extra internal whitespace', () => {
      expect(parseScriptureReference('  John   3:16  ')).toEqual({ usfm: 'JHN.3.16' });
    });
  });

  describe('numbered books (Portuguese and English)', () => {
    it('parses a digit-prefixed English book', () => {
      expect(parseScriptureReference('1 Corinthians 13:4')).toEqual({ usfm: '1CO.13.4' });
    });

    it('parses a digit-prefixed Portuguese book', () => {
      expect(parseScriptureReference('1 Coríntios 13:4')).toEqual({ usfm: '1CO.13.4' });
    });

    it('parses the Portuguese roman-numeral "I/II" convention (e.g. "II Timóteo")', () => {
      expect(parseScriptureReference('II Timóteo 3:16')).toEqual({ usfm: '2TI.3.16' });
    });

    it('distinguishes 1 John from 2 John and 3 John', () => {
      expect(parseScriptureReference('1 João 1:1')).toEqual({ usfm: '1JN.1.1' });
      expect(parseScriptureReference('2 João 1:1')).toEqual({ usfm: '2JN.1.1' });
      expect(parseScriptureReference('3 João 1:1')).toEqual({ usfm: '3JN.1.1' });
    });
  });

  describe('the Job/John ambiguity', () => {
    it('resolves "Jó" (accented) to Job, not John', () => {
      expect(parseScriptureReference('Jó 1:1')).toEqual({ usfm: 'JOB.1.1' });
    });

    it('resolves "Jo" (unaccented, no diacritic) to Job, not John -- genuinely ambiguous, Job wins since it is the exact abbreviation', () => {
      // "Jo" alone is not registered as a John alias specifically because
      // it collides with "Jó" once diacritics are stripped -- see the
      // comment in scripture-reference.ts. This test documents that
      // deliberate choice rather than asserting an arbitrary tie-break.
      expect(parseScriptureReference('Jo 1:1')).toEqual({ usfm: 'JOB.1.1' });
    });
  });

  describe('verse ranges within one chapter', () => {
    it('parses a Portuguese range', () => {
      expect(parseScriptureReference('Salmos 23:1-6')).toEqual({ usfm: 'PSA.23.1-PSA.23.6' });
    });

    it('parses an English range with a period separator', () => {
      expect(parseScriptureReference('Psalm 23.1-6')).toEqual({ usfm: 'PSA.23.1-PSA.23.6' });
    });

    it('parses a range using the "Salmo" (singular) alias', () => {
      expect(parseScriptureReference('Salmo 23:1-6')).toEqual({ usfm: 'PSA.23.1-PSA.23.6' });
    });
  });

  describe('graceful failure on unrecognized input', () => {
    it('returns null for an unknown book name', () => {
      expect(parseScriptureReference('Notabook 3:16')).toBeNull();
    });

    it('returns null for a string with no chapter:verse component', () => {
      expect(parseScriptureReference('John')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(parseScriptureReference('')).toBeNull();
    });

    it('returns null for a chapter with no verse', () => {
      expect(parseScriptureReference('John 3')).toBeNull();
    });

    it('returns null for garbage input', () => {
      expect(parseScriptureReference('asdf;;; not a reference at all')).toBeNull();
    });
  });

  describe('a representative sample across the 66 books', () => {
    it.each([
      ['Genesis 1:1', 'GEN.1.1'],
      ['Gênesis 1:1', 'GEN.1.1'],
      ['Exodus 20:3', 'EXO.20.3'],
      ['Êxodo 20:3', 'EXO.20.3'],
      ['Deuteronomy 6:5', 'DEU.6.5'],
      ['Josué 1:9', 'JOS.1.9'],
      ['Ruth 1:16', 'RUT.1.16'],
      ['1 Samuel 17:45', '1SA.17.45'],
      ['2 Reis 2:11', '2KI.2.11'],
      ['Esther 4:14', 'EST.4.14'],
      ['Provérbios 3:5', 'PRO.3.5'],
      ['Eclesiastes 3:1', 'ECC.3.1'],
      ['Isaiah 53:5', 'ISA.53.5'],
      ['Jeremias 29:11', 'JER.29.11'],
      ['Daniel 3:17', 'DAN.3.17'],
      ['Miquéias 6:8', 'MIC.6.8'],
      ['Matthew 5:9', 'MAT.5.9'],
      ['Mateus 5:9', 'MAT.5.9'],
      ['Marcos 1:1', 'MRK.1.1'],
      ['Lucas 2:11', 'LUK.2.11'],
      ['Acts 2:38', 'ACT.2.38'],
      ['Romanos 8:28', 'ROM.8.28'],
      ['Gálatas 5:22', 'GAL.5.22'],
      ['Ephesians 2:8', 'EPH.2.8'],
      ['Filipenses 4:13', 'PHP.4.13'],
      ['Hebrews 11:1', 'HEB.11.1'],
      ['Tiago 1:2', 'JAS.1.2'],
      ['1 Peter 5:7', '1PE.5.7'],
      ['Judas 1:3', 'JUD.1.3'],
      ['Apocalipse 21:4', 'REV.21.4'],
      ['Revelation 21:4', 'REV.21.4'],
    ])('%s -> %s', (input, expectedUsfm) => {
      expect(parseScriptureReference(input)).toEqual({ usfm: expectedUsfm });
    });
  });
});
