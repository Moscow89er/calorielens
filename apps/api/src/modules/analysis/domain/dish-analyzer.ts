import type { AnalysisSource } from '@calorielens/shared';

export const DISH_ANALYZER = Symbol('DISH_ANALYZER');

export type DishAnalyzerInput = {
  buffer: Buffer;
  mimeType: string;
};

export type DishAnalyzerResult = {
  dishName: string;
  calories: number;
  confidence: number;
  source: AnalysisSource;
};

export interface DishAnalyzer {
  analyze(input: DishAnalyzerInput): Promise<DishAnalyzerResult>;
}
