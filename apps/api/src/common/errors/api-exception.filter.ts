import type { ApiErrorCode, ApiErrorResponse } from '@calorielens/shared';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DomainError } from './domain.error';

type HttpResponse = {
  status: (statusCode: number) => HttpResponse;
  json: (body: ApiErrorResponse) => void;
};

type HttpExceptionBody = {
  message?: string | string[];
};

const STATUS_CODES: Partial<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'VALIDATION_ERROR',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const normalized = this.normalizeException(exception);

    if (normalized.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(normalized.logMessage, stack);
    }

    response.status(normalized.status).json({
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details === undefined ? {} : { details: normalized.details }),
      },
    });
  }

  private normalizeException(exception: unknown): {
    status: number;
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    logMessage: string;
  } {
    if (exception instanceof DomainError) {
      return {
        status: exception.status,
        code: exception.code,
        message: exception.message,
        logMessage: `${exception.code}: ${exception.message}`,
      };
    }

    if (this.isUniqueConstraintError(exception)) {
      return {
        status: HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'Ресурс с такими данными уже существует',
        logMessage: 'Database unique constraint conflict',
      };
    }

    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Внутренняя ошибка сервера',
      logMessage: 'Unhandled application error',
    };
  }

  private normalizeHttpException(exception: HttpException) {
    const status = exception.getStatus();
    const body = exception.getResponse();
    const payload = typeof body === 'object' ? (body as HttpExceptionBody) : undefined;
    const validationMessages = Array.isArray(payload?.message) ? payload.message : undefined;
    const defaultMessage = this.getDefaultMessage(status);
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : typeof body === 'string'
          ? body
          : defaultMessage;
    const isServerError = status >= HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      status,
      code: STATUS_CODES[status] ?? 'INTERNAL_SERVER_ERROR',
      message: isServerError
        ? 'Внутренняя ошибка сервера'
        : validationMessages
          ? 'Ошибка валидации данных'
          : message,
      ...(!isServerError && validationMessages ? { details: validationMessages } : {}),
      logMessage: `${exception.name}: ${message}`,
    };
  }

  private getDefaultMessage(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.PAYLOAD_TOO_LARGE:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Некорректные данные запроса';
      case HttpStatus.UNAUTHORIZED:
        return 'Требуется аутентификация';
      case HttpStatus.FORBIDDEN:
        return 'Недостаточно прав для выполнения операции';
      case HttpStatus.NOT_FOUND:
        return 'Ресурс не найден';
      case HttpStatus.CONFLICT:
        return 'Конфликт данных';
      default:
        return 'Внутренняя ошибка сервера';
    }
  }

  private isUniqueConstraintError(exception: unknown): exception is { code: 'P2002' } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      exception.code === 'P2002'
    );
  }
}
