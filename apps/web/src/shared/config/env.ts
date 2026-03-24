const DEFAULT_LOCAL_API_URL = 'http://localhost:3001';

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    throw new Error('NEXT_PUBLIC_API_URL is empty. Set a valid backend base URL.');
  }

  return trimmed.replace(/\/$/, '');
}

function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!envUrl) {
    if (process.env.NODE_ENV === 'development') {
      return DEFAULT_LOCAL_API_URL;
    }

    throw new Error('NEXT_PUBLIC_API_URL is not set.');
  }

  return normalizeApiBaseUrl(envUrl);
}

export const API_BASE_URL = resolveApiBaseUrl();
