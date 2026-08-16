export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_CREDENTIALS'
  | 'ANALYSIS_TIMEOUT'
  | 'ANALYSIS_UNAVAILABLE'
  | 'INTERNAL_SERVER_ERROR';

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};
