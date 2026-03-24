import { ApiClientError, type ApiErrorPayload, type ApiRequestOptions } from '@/shared/api/types';
import { API_BASE_URL } from '@/shared/config/env';
import { getAccessToken } from '@/shared/lib/token-storage';

const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';

function isBodyInit(value: unknown): value is BodyInit {
  if (typeof value === 'string') {
    return true;
  }

  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    return true;
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true;
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return true;
  }

  return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value);
}

function buildRequestUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function createDefaultErrorMessage(status: number): string {
  return `Request failed with status ${status}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function normalizeApiError(status: number, payload: unknown): ApiClientError {
  const typedPayload = payload as ApiErrorPayload;

  if (typedPayload?.error) {
    return new ApiClientError({
      status,
      code: typedPayload.error.code ?? UNKNOWN_ERROR_CODE,
      message: typedPayload.error.message ?? createDefaultErrorMessage(status),
      details: typedPayload.error.details,
    });
  }

  if (typeof payload === 'string' && payload.trim()) {
    return new ApiClientError({
      status,
      code: UNKNOWN_ERROR_CODE,
      message: payload,
    });
  }

  return new ApiClientError({
    status,
    code: UNKNOWN_ERROR_CODE,
    message: createDefaultErrorMessage(status),
    details: payload,
  });
}

export async function apiClient<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { auth = false, body, headers: customHeaders, method = 'GET', ...rest } = options;

  const headers = new Headers(customHeaders);
  let requestBody: BodyInit | undefined;

  if (body != null) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      requestBody = body;
    } else if (isBodyInit(body)) {
      requestBody = body;
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      requestBody = JSON.stringify(body);
    }
  }

  if (auth && !headers.has('Authorization')) {
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  try {
    const response = await fetch(buildRequestUrl(path), {
      ...rest,
      method,
      headers,
      body: requestBody,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw normalizeApiError(response.status, payload);
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Network request failed';

    throw new ApiClientError({
      status: 0,
      code: NETWORK_ERROR_CODE,
      message,
    });
  }
}

export function apiGet<TResponse>(
  path: string,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
) {
  return apiClient<TResponse>(path, { ...options, method: 'GET' });
}

export function apiPost<TResponse, TBody extends ApiRequestOptions['body']>(
  path: string,
  body?: TBody,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
) {
  return apiClient<TResponse>(path, { ...options, method: 'POST', body });
}
