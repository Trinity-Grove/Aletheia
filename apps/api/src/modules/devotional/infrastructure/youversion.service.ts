import { Injectable } from '@nestjs/common';
import type { BiblePassageDto, BibleVersionDto } from '@aletheia/contracts';
import { parseScriptureReference } from './scripture-reference.js';

export const POPULAR_BIBLE_VERSIONS: BibleVersionDto[] = [
  { id: '1608', name: 'Almeida Revista e Atualizada', language: 'pt', abbreviation: 'ARA' },
  { id: '129', name: 'Nova Versão Internacional', language: 'pt', abbreviation: 'NVI' },
  { id: '1840', name: 'Nova Almeida Atualizada', language: 'pt', abbreviation: 'NAA' },
  { id: '3034', name: 'Berean Standard Bible', language: 'en', abbreviation: 'BSB' },
  { id: '59', name: 'English Standard Version', language: 'en', abbreviation: 'ESV' },
  { id: '1', name: 'King James Version', language: 'en', abbreviation: 'KJV' },
];

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
      const url = `https://api.youversion.com/v1/bibles/${encodeURIComponent(versionId)}/passages/${encodeURIComponent(parsed.usfm)}`;
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
