import { AnalysisSource } from '@calorielens/shared';
import { describe, expect, it } from 'vitest';
import { DemoDishAnalyzer } from '../src/modules/analysis/adapters/demo-dish-analyzer';
import { JPEG_BUFFER } from './helpers/fixtures';

describe('DemoDishAnalyzer', () => {
  it('returns a deterministic, explicitly marked demo result', async () => {
    const analyzer = new DemoDishAnalyzer();
    const input = { buffer: JPEG_BUFFER, mimeType: 'image/jpeg' };

    const first = await analyzer.analyze(input);
    const second = await analyzer.analyze(input);

    expect(second).toEqual(first);
    expect(first.source).toBe(AnalysisSource.DEMO);
    expect(first.calories).toBeGreaterThan(0);
    expect(first.confidence).toBeGreaterThanOrEqual(0);
    expect(first.confidence).toBeLessThanOrEqual(1);
  });
});
