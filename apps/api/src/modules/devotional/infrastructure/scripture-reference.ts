// Converts a human-readable Scripture reference (English or Portuguese,
// full book name or common abbreviation) into the USFM-style code
// YouVersion's real API requires (e.g. "JHN.3.16",
// "PSA.23.1-PSA.23.6") -- confirmed against the live API: "JHN.3.16"
// resolves correctly, a raw human string like "John 3:16" 404s.
//
// Deliberately scoped to a single reference expression (one book,
// chapter, and verse or verse range within that chapter) -- not
// comma-separated compound references (e.g. "Salmos 23:1-6, João
// 3:16" as one combined lookup). The real API's support for compound
// references isn't part of the confirmed behavior this fix is based on,
// so guessing at that contract would risk another silent-failure bug of
// the same kind this fix is closing. A caller with multiple references
// should call this converter (and fetchPassage) once per reference.

interface BookAlias {
  code: string;
  names: string[];
}

// USFM book codes for all 66 books, with common English and Portuguese
// full names and abbreviations. Not exhaustive of every possible human
// abbreviation, but covers full names (PT/EN) and the abbreviations
// most Bible apps and print Bibles actually use.
const BOOK_ALIASES: BookAlias[] = [
  { code: 'GEN', names: ['genesis', 'gênesis', 'gen', 'gn'] },
  { code: 'EXO', names: ['exodus', 'êxodo', 'exodo', 'exo', 'ex'] },
  { code: 'LEV', names: ['leviticus', 'levitico', 'levítico', 'lev', 'lv'] },
  { code: 'NUM', names: ['numbers', 'numeros', 'números', 'num', 'nm'] },
  { code: 'DEU', names: ['deuteronomy', 'deuteronomio', 'deuteronômio', 'deut', 'dt'] },
  { code: 'JOS', names: ['joshua', 'josue', 'josué', 'jos'] },
  { code: 'JDG', names: ['judges', 'juizes', 'juízes', 'jdg', 'jz'] },
  { code: 'RUT', names: ['ruth', 'rute', 'rut', 'rt'] },
  { code: '1SA', names: ['1 samuel', 'i samuel', '1sa', '1sm', '1 sm'] },
  { code: '2SA', names: ['2 samuel', 'ii samuel', '2sa', '2sm', '2 sm'] },
  { code: '1KI', names: ['1 kings', '1 reis', 'i reis', '1ki', '1re', '1 rs'] },
  { code: '2KI', names: ['2 kings', '2 reis', 'ii reis', '2ki', '2re', '2 rs'] },
  { code: '1CH', names: ['1 chronicles', '1 cronicas', '1 crônicas', 'i cronicas', '1ch', '1cr', '1 cr'] },
  { code: '2CH', names: ['2 chronicles', '2 cronicas', '2 crônicas', 'ii cronicas', '2ch', '2cr', '2 cr'] },
  { code: 'EZR', names: ['ezra', 'esdras', 'ezr', 'ed'] },
  { code: 'NEH', names: ['nehemiah', 'neemias', 'neh', 'ne'] },
  { code: 'EST', names: ['esther', 'ester', 'est', 'et'] },
  { code: 'JOB', names: ['job', 'jó', 'jb'] },
  { code: 'PSA', names: ['psalms', 'psalm', 'salmos', 'salmo', 'psa', 'sl', 'sal'] },
  { code: 'PRO', names: ['proverbs', 'proverbios', 'provérbios', 'pro', 'pv'] },
  { code: 'ECC', names: ['ecclesiastes', 'eclesiastes', 'ecc', 'ec'] },
  { code: 'SNG', names: ['song of songs', 'song of solomon', 'cantares', 'cantares de salomao', 'cantico dos canticos', 'cânticos', 'sng', 'ct'] },
  { code: 'ISA', names: ['isaiah', 'isaias', 'isaías', 'isa', 'is'] },
  { code: 'JER', names: ['jeremiah', 'jeremias', 'jer', 'jr'] },
  { code: 'LAM', names: ['lamentations', 'lamentacoes', 'lamentações', 'lam', 'lm'] },
  { code: 'EZK', names: ['ezekiel', 'ezequiel', 'ezk', 'ez'] },
  { code: 'DAN', names: ['daniel', 'dan', 'dn'] },
  { code: 'HOS', names: ['hosea', 'oseias', 'oséias', 'hos', 'os'] },
  { code: 'JOL', names: ['joel', 'jl'] },
  { code: 'AMO', names: ['amos', 'amós', 'am'] },
  { code: 'OBA', names: ['obadiah', 'obadias', 'oba', 'ob'] },
  { code: 'JON', names: ['jonah', 'jonas', 'jon'] },
  { code: 'MIC', names: ['micah', 'miqueias', 'miquéias', 'mic', 'mq'] },
  { code: 'NAM', names: ['nahum', 'naum', 'nam', 'na'] },
  { code: 'HAB', names: ['habakkuk', 'habacuque', 'hab'] },
  { code: 'ZEP', names: ['zephaniah', 'sofonias', 'zep', 'sf'] },
  { code: 'HAG', names: ['haggai', 'ageu', 'hag', 'ag'] },
  { code: 'ZEC', names: ['zechariah', 'zacarias', 'zec', 'zc'] },
  { code: 'MAL', names: ['malachi', 'malaquias', 'mal'] },
  { code: 'MAT', names: ['matthew', 'mateus', 'mat', 'mt'] },
  { code: 'MRK', names: ['mark', 'marcos', 'mrk', 'mc'] },
  { code: 'LUK', names: ['luke', 'lucas', 'luk', 'lc'] },
  // NOTE: no bare "jo" alias here -- it's genuinely ambiguous with "Jó"
  // (Job), which normalizes to the same string once diacritics are
  // stripped. Callers must use "joão"/"joao"/"jhn" for John.
  { code: 'JHN', names: ['john', 'joao', 'joão', 'jhn'] },
  { code: 'ACT', names: ['acts', 'atos', 'act', 'at'] },
  { code: 'ROM', names: ['romans', 'romanos', 'rom', 'rm'] },
  { code: '1CO', names: ['1 corinthians', '1 corintios', '1 coríntios', 'i corintios', '1co', '1 co'] },
  { code: '2CO', names: ['2 corinthians', '2 corintios', '2 coríntios', 'ii corintios', '2co', '2 co'] },
  { code: 'GAL', names: ['galatians', 'galatas', 'gálatas', 'gal', 'gl'] },
  { code: 'EPH', names: ['ephesians', 'efesios', 'efésios', 'eph', 'ef'] },
  { code: 'PHP', names: ['philippians', 'filipenses', 'php', 'fp'] },
  { code: 'COL', names: ['colossians', 'colossenses', 'col'] },
  { code: '1TH', names: ['1 thessalonians', '1 tessalonicenses', 'i tessalonicenses', '1th', '1 ts'] },
  { code: '2TH', names: ['2 thessalonians', '2 tessalonicenses', 'ii tessalonicenses', '2th', '2 ts'] },
  { code: '1TI', names: ['1 timothy', '1 timoteo', '1 timóteo', 'i timoteo', '1ti', '1 tm'] },
  { code: '2TI', names: ['2 timothy', '2 timoteo', '2 timóteo', 'ii timoteo', '2ti', '2 tm'] },
  { code: 'TIT', names: ['titus', 'tito', 'tit'] },
  { code: 'PHM', names: ['philemon', 'filemom', 'phm', 'fm'] },
  { code: 'HEB', names: ['hebrews', 'hebreus', 'heb'] },
  { code: 'JAS', names: ['james', 'tiago', 'jas', 'tg'] },
  { code: '1PE', names: ['1 peter', '1 pedro', 'i pedro', '1pe', '1 pe'] },
  { code: '2PE', names: ['2 peter', '2 pedro', 'ii pedro', '2pe', '2 pe'] },
  { code: '1JN', names: ['1 john', '1 joao', '1 joão', 'i joao', '1jn', '1 jo'] },
  { code: '2JN', names: ['2 john', '2 joao', '2 joão', 'ii joao', '2jn', '2 jo'] },
  { code: '3JN', names: ['3 john', '3 joao', '3 joão', 'iii joao', '3jn', '3 jo'] },
  { code: 'JUD', names: ['jude', 'judas', 'jud'] },
  { code: 'REV', names: ['revelation', 'apocalipse', 'rev', 'ap'] },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (e.g. "João" -> "joao")
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const BOOK_LOOKUP: Map<string, string> = new Map();
for (const { code, names } of BOOK_ALIASES) {
  for (const name of names) {
    BOOK_LOOKUP.set(normalize(name), code);
  }
}

const REFERENCE_PATTERN = /^(.+?)\s+(\d+)[:.](\d+)(?:-(\d+))?$/;

export interface ParsedScriptureReference {
  usfm: string;
}

/**
 * Parses a human-readable Scripture reference (English or Portuguese,
 * full book name or abbreviation, accent- and case-insensitive) into
 * the USFM code YouVersion's API requires. Returns null for anything
 * that doesn't match a recognized book + chapter:verse[-verse] shape,
 * so the caller can fail gracefully instead of hitting the API with
 * garbage.
 */
export function parseScriptureReference(input: string): ParsedScriptureReference | null {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  const match = REFERENCE_PATTERN.exec(trimmed);
  if (!match) return null;

  const [, rawBook, chapter, verseStart, verseEnd] = match;
  if (!rawBook || !chapter || !verseStart) return null;
  const code = BOOK_LOOKUP.get(normalize(rawBook));
  if (!code) return null;

  const usfm = verseEnd
    ? `${code}.${chapter}.${verseStart}-${code}.${chapter}.${verseEnd}`
    : `${code}.${chapter}.${verseStart}`;

  return { usfm };
}
