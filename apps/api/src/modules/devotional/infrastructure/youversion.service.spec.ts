import { YouVersionService, POPULAR_BIBLE_VERSIONS } from './youversion.service.js';

describe('YouVersionService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAvailableBibles', () => {
    it('returns list of popular translations', async () => {
      const service = new YouVersionService();
      const bibles = await service.getAvailableBibles();
      expect(bibles).toEqual(POPULAR_BIBLE_VERSIONS);
      expect(bibles.some((b) => b.abbreviation === 'BSB')).toBe(true);
      expect(bibles.some((b) => b.abbreviation === 'ARA')).toBe(true);
    });
  });

  describe('fetchPassage', () => {
    it('returns fallback content when no API key is configured', async () => {
      delete process.env.YOUVERSION_APP_KEY;
      delete process.env.YVP_APP_KEY;

      const service = new YouVersionService();
      const result = await service.fetchPassage('John 3:16', '3034');

      expect(result).toEqual({
        reference: 'John 3:16',
        versionId: '3034',
        content: '',
      });
    });

    // Confirmed directly against the live YouVersion API: "JHN.3.16"
    // resolves correctly; a raw human-readable string like "John 3:16"
    // 404s. fetchPassage must convert the reference to USFM before
    // calling the API -- this is the actual bug this fix closes.
    it('converts a human-readable reference to USFM before calling the API', async () => {
      process.env.YOUVERSION_APP_KEY = 'test-key-123';

      const mockResponse = {
        reference: 'John 3:16',
        version_id: '3034',
        content: 'For God so loved the world...',
        copyright: 'Berean Standard Bible',
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const service = new YouVersionService();
      const result = await service.fetchPassage('John 3:16', '3034');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.youversion.com/v1/bibles/3034/passages/JHN.3.16',
        {
          method: 'GET',
          headers: {
            'X-YVP-App-Key': 'test-key-123',
          },
        },
      );
      expect(result).toEqual({
        reference: 'John 3:16',
        versionId: '3034',
        content: 'For God so loved the world...',
        copyright: 'Berean Standard Bible',
      });
    });

    it('converts a Portuguese reference with a verse range to USFM', async () => {
      process.env.YOUVERSION_APP_KEY = 'test-key-123';

      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reference: 'Salmos 23:1-6', version_id: '1608', content: 'O Senhor é o meu pastor...' }),
      } as Response);

      const service = new YouVersionService();
      await service.fetchPassage('Salmos 23:1-6', '1608');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.youversion.com/v1/bibles/1608/passages/PSA.23.1-PSA.23.6',
        expect.anything(),
      );
    });

    it('returns null (not an API call) for a reference it cannot recognize', async () => {
      process.env.YOUVERSION_APP_KEY = 'test-key-123';
      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      const service = new YouVersionService();
      const result = await service.fetchPassage('not a real reference', '3034');

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns fallback content when API request fails with error status', async () => {
      process.env.YOUVERSION_APP_KEY = 'test-key-123';

      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const service = new YouVersionService();
      const result = await service.fetchPassage('John 99:99', '3034');

      expect(result).toEqual({
        reference: 'John 99:99',
        versionId: '3034',
        content: '',
      });
    });

    it('returns fallback content when fetch throws network error', async () => {
      process.env.YOUVERSION_APP_KEY = 'test-key-123';

      jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const service = new YouVersionService();
      const result = await service.fetchPassage('John 3:16', '3034');

      expect(result).toEqual({
        reference: 'John 3:16',
        versionId: '3034',
        content: '',
      });
    });
  });
});
