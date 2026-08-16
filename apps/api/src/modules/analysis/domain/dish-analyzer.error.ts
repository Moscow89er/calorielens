import { DomainError } from '../../../common/errors/domain.error';

export type DishAnalyzerFailure = 'TIMEOUT' | 'UNAVAILABLE' | 'INVALID_RESPONSE';

export class DishAnalyzerError extends DomainError {
  private constructor(
    readonly failure: DishAnalyzerFailure,
    code: 'ANALYSIS_TIMEOUT' | 'ANALYSIS_UNAVAILABLE',
    message: string,
  ) {
    super(code, failure === 'TIMEOUT' ? 504 : 503, message);
    this.name = 'DishAnalyzerError';
  }

  static timeout(): DishAnalyzerError {
    return new DishAnalyzerError(
      'TIMEOUT',
      'ANALYSIS_TIMEOUT',
      'Сервис анализа не ответил вовремя. Попробуйте ещё раз',
    );
  }

  static unavailable(): DishAnalyzerError {
    return new DishAnalyzerError(
      'UNAVAILABLE',
      'ANALYSIS_UNAVAILABLE',
      'Сервис анализа временно недоступен. Попробуйте ещё раз',
    );
  }

  static invalidResponse(): DishAnalyzerError {
    return new DishAnalyzerError(
      'INVALID_RESPONSE',
      'ANALYSIS_UNAVAILABLE',
      'Не удалось обработать результат анализа. Попробуйте другое изображение',
    );
  }
}
