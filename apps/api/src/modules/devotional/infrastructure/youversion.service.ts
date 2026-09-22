import { Injectable } from '@nestjs/common';
import type { BiblePassageDto, BibleVersionDto } from '@aletheia/contracts';
import { parseScriptureReference } from './scripture-reference.js';

// Verified 2026-09-22 against the live API with the production app key
// (GET /v1/bibles?language_ranges[]=pt|en, and GET /v1/bibles/{id} for
// each id below): only these translations resolve for this key. Almeida
// (ARA/ARC), Nova Almeida Atualizada, ESV and KJV are NOT in this app's
// catalog -- offering them 404s upstream and the lookup silently returns
// no text (#214). Re-verify with the same calls before adding an entry.
export const POPULAR_BIBLE_VERSIONS: BibleVersionDto[] = [
  { id: '129', name: 'Nova Versão Internacional', language: 'pt', abbreviation: 'NVI' },
  { id: '3254', name: 'Bíblia Livre Para Todos', language: 'pt', abbreviation: 'BLT' },
  { id: '3034', name: 'Berean Standard Bible', language: 'en', abbreviation: 'BSB' },
  { id: '111', name: 'New International Version (2011)', language: 'en', abbreviation: 'NIV11' },
];

// The devotional form sends the translation by abbreviation slug ("ara",
// "nvi", ...), while YouVersion's API path needs its numeric Bible id.
// Numeric ids pass through unchanged; an unknown slug is passed as-is and
// simply yields no content upstream.
function resolveYouVersionBibleId(versionId: string): string {
  const slug = versionId.trim().toLowerCase();
  const known = POPULAR_BIBLE_VERSIONS.find((version) => version.abbreviation.toLowerCase() === slug);
  return known?.id ?? versionId;
}

@Injectable()
export class YouVersionService {
  private readonly appKey: string | null;

  constructor() {
    this.appKey = process.env.YOUVERSION_APP_KEY ?? process.env.YVP_APP_KEY ?? null;
  }

  async getAvailableBibles(): Promise<BibleVersionDto[]> {
    return POPULAR_BIBLE_VERSIONS;
  }

  async fetchPassage(reference: string, versionId = '3034'): Promise<BiblePassageDto | null> {
    // YouVersion's real API requires a USFM-style code in the path
    // (e.g. "JHN.3.16", "PSA.23.1-PSA.23.6") -- confirmed directly
    // against the live API: a human-readable reference like
    // "John 3:16" 404s. A reference this converter doesn't recognize
    // is reported as null (not silently sent to the API as garbage,
    // and not confused with a legitimate API-side failure, which
    // still falls back to empty content below) so the caller can show
    // "reference not recognized."
    const parsed = parseScriptureReference(reference);
    if (!parsed) {
      return null;
    }

    if (!this.appKey) {
      return {
        reference,
        versionId,
        content: '',
      };
    }

    try {
      const url = `https://api.youversion.com/v1/bibles/${encodeURIComponent(resolveYouVersionBibleId(versionId))}/passages/${encodeURIComponent(parsed.usfm)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-YVP-App-Key': this.appKey,
        },
      });

      if (!response.ok) {
        return {
          reference,
          versionId,
          content: '',
        };
      }

      const data = (await response.json()) as {
        reference?: string;
        version_id?: string;
        content?: string;
        copyright?: string;
      };

      return {
        reference: data.reference ?? reference,
        versionId: data.version_id ?? versionId,
        content: data.content ?? '',
        copyright: data.copyright,
      };
    } catch {
      return {
        reference,
        versionId,
        content: '',
      };
    }
  }
}
