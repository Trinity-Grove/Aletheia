import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  ApiError,
  getApiAuthToken,
  setApiAuthToken,
} from '../src/lib/api';

describe('Centralized HTTP API Client (apiClient)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    setApiAuthToken(null);
    process.env.NEXT_PUBLIC_API_URL = '/api/v1';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    vi.restoreAllMocks();
  });

  describe('setApiAuthToken and getApiAuthToken', () => {
    it('manages auth token state', () => {
      expect(getApiAuthToken()).toBeNull();
      setApiAuthToken('test-token-123');
      expect(getApiAuthToken()).toBe('test-token-123');
      setApiAuthToken(null);
      expect(getApiAuthToken()).toBeNull();
    });
  });

  describe('HTTP Methods', () => {
    it('performs GET requests', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const result = await api.get<{ message: string }>('/learners');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/learners',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(result).toEqual({ message: 'ok' });
    });

    it('performs POST requests with JSON body', async () => {
      const payload = { name: 'João', age: 10 };
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: '123', ...payload }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const result = await api.post('/learners', payload);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/learners',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
          headers: expect.any(Headers),
        }),
      );
      const callInit = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const callHeaders = callInit.headers as Headers;
      expect(callHeaders.get('Content-Type')).toBe('application/json');
      expect(result).toEqual({ id: '123', ...payload });
    });

    it('performs PATCH requests with JSON body', async () => {
      const payload = { name: 'João Silva' };
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: '123', ...payload }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const result = await api.patch('/learners/123', payload);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/learners/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(payload),
        }),
      );
      expect(result).toEqual({ id: '123', ...payload });
    });

    it('performs PUT requests with JSON body', async () => {
      const payload = { name: 'João Updated' };
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ id: '123', ...payload }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const result = await api.put('/learners/123', payload);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/learners/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      );
      expect(result).toEqual({ id: '123', ...payload });
    });

    it('performs DELETE requests', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(null, {
            status: 204,
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      const result = await api.delete('/learners/123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/learners/123',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
      expect(result).toBeUndefined();
    });
  });

  describe('URL resolution and query parameters', () => {
    it('prepends base URL and prepends slash if missing', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('learners');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/learners',
        expect.anything(),
      );
    });

    it('uses absolute URL without modifying when path starts with http:// or https://', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('https://external-api.com/v1/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.com/v1/data',
        expect.anything(),
      );
    });

    it('respects custom NEXT_PUBLIC_API_URL environment variable', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333/custom-api';
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/records');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3333/custom-api/records',
        expect.anything(),
      );
    });

    it('serializes query parameters and filters out undefined values', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/curriculum', {
        params: {
          search: 'matemática',
          page: 1,
          active: true,
          excluded: undefined,
        },
      });

      const calledUrl = (mockFetch.mock.calls[0]?.[0] ?? '') as string;
      expect(calledUrl).toContain('/api/v1/curriculum?');
      expect(calledUrl).toContain('search=matem%C3%A1tica');
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('active=true');
      expect(calledUrl).not.toContain('excluded');
    });

    it('handles query parameters when URL already contains query string', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/curriculum?sort=desc', {
        params: {
          page: 2,
        },
      });

      const calledUrl = (mockFetch.mock.calls[0]?.[0] ?? '') as string;
      expect(calledUrl).toBe('/api/v1/curriculum?sort=desc&page=2');
    });
  });

  describe('Header injection', () => {
    it('injects Authorization header from setApiAuthToken', async () => {
      setApiAuthToken('jwt-token-xyz');
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/profile');

      const callInit = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const headers = callInit.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer jwt-token-xyz');
    });

    it('injects Authorization header from options.token overriding global token', async () => {
      setApiAuthToken('global-token');
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/profile', { token: 'override-token' });

      const callInit = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const headers = callInit.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer override-token');
    });

    it('suppresses Authorization header when options.token is null', async () => {
      setApiAuthToken('global-token');
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/public', { token: null });

      const callInit = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const headers = callInit.headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });

    it('injects x-family-id header when options.familyId is provided', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/family/members', {
        familyId: 'family-uuid-123',
      });

      const callInit = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const headers = callInit.headers as Headers;
      expect(headers.get('x-family-id')).toBe('family-uuid-123');
    });

    it('does not set Content-Type header when sending FormData body', async () => {
      const formData = new FormData();
      formData.append('file', 'test content');

      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.post('/upload', formData);

      const options = (mockFetch.mock.calls[0]?.[1] ?? {}) as RequestInit;
      const headers = options.headers as Headers;
      expect(headers.get('Content-Type')).toBeNull();
      expect(options.body).toBe(formData);
    });

    it('merges custom headers from options.headers', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
      );
      vi.stubGlobal('fetch', mockFetch);

      await api.get('/custom', {
        headers: {
          'X-Custom-Header': 'CustomValue',
        },
      });

      const callInit = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const headers = callInit.headers as Headers;
      expect(headers.get('X-Custom-Header')).toBe('CustomValue');
    });
  });

  describe('Error Handling and ApiError', () => {
    it('throws ApiError with structured details for API errors', async () => {
      const errorBody = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid learner name',
        details: { field: 'name' },
      };
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorBody), {
            status: 400,
            statusText: 'Bad Request',
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      await expect(api.post('/learners', {})).rejects.toThrow(ApiError);

      try {
        await api.post('/learners', {});
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiError = err as ApiError;
        expect(apiError.statusCode).toBe(400);
        expect(apiError.error).toBe('Bad Request');
        expect(apiError.message).toBe('Invalid learner name');
        expect(apiError.details).toEqual({ field: 'name' });
        expect(apiError.name).toBe('ApiError');
      }
    });

    it('joins array message validation errors with comma', async () => {
      const errorBody = {
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: ['Nome é obrigatório', 'Idade deve ser um número positivo'],
      };
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorBody), {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      try {
        await api.post('/learners', {});
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiError = err as ApiError;
        expect(apiError.statusCode).toBe(422);
        expect(apiError.message).toBe('Nome é obrigatório, Idade deve ser um número positivo');
      }
    });

    it('dispatches auth:unauthorized custom event on 401 response in window environment', async () => {
      const dispatchSpy = vi.fn();
      vi.stubGlobal('window', {
        dispatchEvent: dispatchSpy,
      });

      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ statusCode: 401, error: 'Unauthorized', message: 'Token expired' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      await expect(api.get('/protected')).rejects.toThrow(ApiError);
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const dispatchedEvent = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
      expect(dispatchedEvent.type).toBe('auth:unauthorized');
    });

    it('handles non-JSON error response gracefully', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response('Internal Server Error', {
            status: 500,
            statusText: 'Internal Server Error',
            headers: { 'Content-Type': 'text/plain' },
          }),
        ),
      );
      vi.stubGlobal('fetch', mockFetch);

      try {
        await api.get('/broken');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiError = err as ApiError;
        expect(apiError.statusCode).toBe(500);
        expect(apiError.error).toBe('Internal Server Error');
        expect(apiError.message).toBe('Internal Server Error');
      }
    });
  });
});
