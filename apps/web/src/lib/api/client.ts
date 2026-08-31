export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string | null;
  familyId?: string | null;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let currentAuthToken: string | null = null;

export function setApiAuthToken(token: string | null): void {
  currentAuthToken = token;
}

export function getApiAuthToken(): string | null {
  return currentAuthToken;
}

function resolveUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  let url: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path;
  } else {
    const base = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    url = `${base}${normalizedPath}`;
  }

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }
  }

  return url;
}

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { params, token, familyId, headers: customHeaders, ...restOptions } = options;
  const url = resolveUrl(path, params);

  const headers = new Headers(customHeaders);

  const effectiveToken = token !== undefined ? token : currentAuthToken;
  if (effectiveToken) {
    headers.set('Authorization', `Bearer ${effectiveToken}`);
  }

  if (familyId) {
    headers.set('x-family-id', familyId);
  }

  let formattedBody: BodyInit | undefined;
  if (body !== undefined) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      formattedBody = body;
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      formattedBody = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }

  const fetchInit: RequestInit = {
    credentials: 'include',
    ...restOptions,
    method,
    headers,
    ...(formattedBody !== undefined ? { body: formattedBody } : {}),
  };

  const response = await fetch(url, fetchInit);

  if (!response.ok) {
    let errorTitle = response.statusText || 'Error';
    let errorMessage = response.statusText || 'Request failed';
    let details: unknown = undefined;

    try {
      const errorData = (await response.json()) as Record<string, unknown>;
      if (errorData && typeof errorData === 'object') {
        if ('error' in errorData && typeof errorData.error === 'string') {
          errorTitle = errorData.error;
        }
        if ('message' in errorData) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          }
        }
        if ('details' in errorData) {
          details = errorData.details;
        } else {
          details = errorData;
        }
      }
    } catch {
      // Fallback to default status text if response is not JSON
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    throw new ApiError(response.status, errorTitle, errorMessage, details);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'GET', undefined, options);
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'POST', body, options);
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'PATCH', body, options);
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'PUT', body, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, 'DELETE', undefined, options);
  },
};
