import type { ApiErrorCode } from '@calorielens/shared';

export class DomainError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
