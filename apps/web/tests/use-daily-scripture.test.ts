import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDailyScripture } from '../src/components/dashboard/use-daily-scripture';

describe('useDailyScripture hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns canonical verse when no familyId is provided', () => {
    const { result } = renderHook(() => useDailyScripture(null, '2026-09-16'));

    expect(result.current.verseText).toBeTruthy();
    expect(result.current.citation).toBeTruthy();
    expect(result.current.isFromFamilyDevotional).toBe(false);
  });

  it('fetches family devotional and prioritizes memoryVerse when available', async () => {
    const mockDevotional = {
      id: 'dev-1',
      familyId: 'fam-1',
      date: '2026-09-16',
      bibleReference: 'Salmos 119:105',
      bibleVersionId: 'ARA',
      memoryVerse: 'Lâmpada para os meus pés é a tua palavra e luz para os meus caminhos.',
      passageText: 'Texto mais longo do capítulo...',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockDevotional,
    } as Response);

    const { result } = renderHook(() => useDailyScripture('fam-1', '2026-09-16'));

    await waitFor(() => {
      expect(result.current.isFromFamilyDevotional).toBe(true);
      expect(result.current.verseText).toBe(
        'Lâmpada para os meus pés é a tua palavra e luz para os meus caminhos.'
      );
      expect(result.current.citation).toBe('Salmos 119:105 (ARA)');
    });
  });

  it('uses passageText if memoryVerse is absent in family devotional', async () => {
    const mockDevotional = {
      id: 'dev-2',
      familyId: 'fam-1',
      date: '2026-09-16',
      bibleReference: 'Gênesis 1:1',
      passageText: 'No princípio, criou Deus os céus e a terra.',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockDevotional,
    } as Response);

    const { result } = renderHook(() => useDailyScripture('fam-1', '2026-09-16'));

    await waitFor(() => {
      expect(result.current.isFromFamilyDevotional).toBe(true);
      expect(result.current.verseText).toBe('No princípio, criou Deus os céus e a terra.');
      expect(result.current.citation).toBe('Gênesis 1:1');
    });
  });

  it('falls back to canonical verse if family devotional is null or 404', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => null,
    } as Response);

    const { result } = renderHook(() => useDailyScripture('fam-1', '2026-09-16'));

    await waitFor(() => {
      expect(result.current.isFromFamilyDevotional).toBe(false);
      expect(result.current.verseText).toBeTruthy();
      expect(result.current.citation).toBeTruthy();
    });
  });

  it('falls back gracefully to canonical verse on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useDailyScripture('fam-1', '2026-09-16'));

    await waitFor(() => {
      expect(result.current.isFromFamilyDevotional).toBe(false);
      expect(result.current.verseText).toBeTruthy();
    });
  });
});
