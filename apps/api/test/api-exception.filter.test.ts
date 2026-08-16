import { type ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

function createHost() {
  const json = vi.fn();
  const response = {
    status: vi.fn().mockReturnThis(),
    json,
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as ArgumentsHost;

  return { host, response, json };
}

describe('ApiExceptionFilter', () => {
  it('maps a Prisma unique race to the shared conflict contract', () => {
    const { host, response, json } = createHost();

    new ApiExceptionFilter().catch({ code: 'P2002', providerDetails: 'private' }, host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'CONFLICT',
        message: 'Ресурс с такими данными уже существует',
      },
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('providerDetails');
  });

  it('sanitizes an HttpException with a 5xx status', () => {
    const { host, response, json } = createHost();
    const loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const exception = new HttpException(
      {
        message: 'Database password was rejected',
        details: { connectionString: 'postgresql://private' },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    try {
      new ApiExceptionFilter().catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Внутренняя ошибка сервера',
        },
      });
      expect(JSON.stringify(json.mock.calls)).not.toContain('Database password');
      expect(JSON.stringify(json.mock.calls)).not.toContain('connectionString');
      expect(loggerError).toHaveBeenCalledWith(
        expect.stringContaining('Database password was rejected'),
        exception.stack,
      );
    } finally {
      loggerError.mockRestore();
    }
  });
});
