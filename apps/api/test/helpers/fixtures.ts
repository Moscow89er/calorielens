import { AnalysisSource } from '@calorielens/shared';
import type { Analysis } from '@prisma/client';

export const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

export function createAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: 'analysis-1',
    userId: 'user-1',
    imageKey: '11111111-1111-4111-8111-111111111111.jpg',
    imageMimeType: 'image/jpeg',
    dishName: 'Овощной салат',
    calories: 240,
    confidence: 0.87,
    source: AnalysisSource.DEMO,
    createdAt: new Date('2026-08-16T10:00:00.000Z'),
    ...overrides,
  };
}
