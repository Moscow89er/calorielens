import { createHash } from 'node:crypto';
import { AnalysisSource } from '@calorielens/shared';
import type { DishAnalyzer, DishAnalyzerInput, DishAnalyzerResult } from '../domain/dish-analyzer';

const DEMO_RESULTS = [
  { dishName: 'Паста с томатным соусом', calories: 520, confidence: 0.91 },
  { dishName: 'Овощной салат', calories: 240, confidence: 0.87 },
  { dishName: 'Курица с рисом', calories: 610, confidence: 0.89 },
  { dishName: 'Сырники со сметаной', calories: 430, confidence: 0.85 },
  { dishName: 'Сэндвич с индейкой', calories: 390, confidence: 0.88 },
] as const;

export class DemoDishAnalyzer implements DishAnalyzer {
  async analyze({ buffer }: DishAnalyzerInput): Promise<DishAnalyzerResult> {
    const digest = createHash('sha256').update(buffer).digest();
    const result = DEMO_RESULTS[digest[0] % DEMO_RESULTS.length];

    return {
      ...result,
      source: AnalysisSource.DEMO,
    };
  }
}
