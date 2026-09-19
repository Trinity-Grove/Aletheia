import { useEffect, useState } from 'react';
import type { DailyDevotionalResponseDto } from '@aletheia/contracts';
import { getDailyCanonicalVerse } from '../../lib/scripture/daily-verses';

export interface DailyScriptureState {
  verseText: string;
  citation: string;
  theme: string | undefined;
  isFromFamilyDevotional: boolean;
  devotionalId?: string;
  loading: boolean;
}

export function useDailyScripture(
  familyId?: string | null,
  dateStr?: string,
): DailyScriptureState {
  const effectiveDate =
    dateStr ||
    (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

  const canonical = getDailyCanonicalVerse(effectiveDate);

  const [state, setState] = useState<DailyScriptureState>({
    verseText: canonical.verseText,
    citation: canonical.citation,
    theme: canonical.theme,
    isFromFamilyDevotional: false,
    loading: !!familyId,
  });

  useEffect(() => {
    const fallback = getDailyCanonicalVerse(effectiveDate);

    if (!familyId) {
      setState({
        verseText: fallback.verseText,
        citation: fallback.citation,
        theme: fallback.theme,
        isFromFamilyDevotional: false,
        loading: false,
      });
      return;
    }

    let isMounted = true;

    async function fetchFamilyDevotional() {
      try {
        const res = await fetch(
          `/api/v1/families/${familyId}/devotionals/by-date?date=${effectiveDate}`,
          { credentials: 'include' },
        );

        if (!res.ok) {
          if (isMounted) {
            setState({
              verseText: fallback.verseText,
              citation: fallback.citation,
              theme: fallback.theme,
              isFromFamilyDevotional: false,
              loading: false,
            });
          }
          return;
        }

        const data: DailyDevotionalResponseDto | null = await res.json();

        if (!isMounted) return;

        if (data && (data.memoryVerse || data.passageText)) {
          const verseText = data.memoryVerse || data.passageText || fallback.verseText;
          const versionSuffix = data.bibleVersionId ? ` (${data.bibleVersionId})` : '';
          const citation = `${data.bibleReference}${versionSuffix}`;

          setState({
            verseText,
            citation,
            theme: undefined,
            isFromFamilyDevotional: true,
            devotionalId: data.id,
            loading: false,
          });
        } else {
          setState({
            verseText: fallback.verseText,
            citation: fallback.citation,
            theme: fallback.theme,
            isFromFamilyDevotional: false,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setState({
            verseText: fallback.verseText,
            citation: fallback.citation,
            theme: fallback.theme,
            isFromFamilyDevotional: false,
            loading: false,
          });
        }
      }
    }

    void fetchFamilyDevotional();

    return () => {
      isMounted = false;
    };
  }, [familyId, effectiveDate]);

  return state;
}
