export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  headers?: HeadersInit;
  auth?: boolean;
};

export type ApiClientErrorParams = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor({ status, code, message, details }: ApiClientErrorParams) {
    super(message);

    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
