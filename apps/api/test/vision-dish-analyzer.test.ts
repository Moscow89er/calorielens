import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VisionDishAnalyzer } from '../src/modules/analysis/adapters/vision-dish-analyzer';
import { DishAnalyzerError } from '../src/modules/analysis/domain/dish-analyzer.error';
import { JPEG_BUFFER } from './helpers/fixtures';

const INPUT = { buffer: JPEG_BUFFER, mimeType: 'image/jpeg' };

function createConfig(timeoutMs = 100): ConfigService {
  const values: Record<string, unknown> = {
    VISION_API_KEY: 'test-key',
    VISION_API_URL: 'https://provider.example/v1/responses',
    VISION_MODEL: 'vision-test-model',
    VISION_TIMEOUT_MS: timeoutMs,
  };

  return {
    getOrThrow: (key: string) => values[key],
  } as ConfigService;
}

function createProviderResponse(result: unknown): Response {
  return new Response(
    JSON.stringify({
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify(result) }],
        },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('VisionDishAnalyzer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps a valid structured provider response to the domain result', async () => {
    const fetchMock = vi.fn(async () =>
      createProviderResponse({ dishName: 'Борщ', calories: 350, confidence: 0.93 }),
    );
    const analyzer = new VisionDishAnalyzer(createConfig(), fetchMock as typeof fetch);

    await expect(analyzer.analyze(INPUT)).resolves.toEqual({
      dishName: 'Борщ',
      calories: 350,
      confidence: 0.93,
      source: 'VISION',
    });

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      input: Array<{ content: Array<{ type: string; image_url?: string }> }>;
      text: { format: { type: string; strict: boolean } };
      reasoning: { effort: string };
      max_output_tokens: number;
    };
    expect(request.input[0]?.content[1]?.image_url).toMatch(/^data:image\/jpeg;base64,/);
    expect(request.text.format).toMatchObject({ type: 'json_schema', strict: true });
    expect(request.reasoning).toEqual({ effort: 'none' });
    expect(request.max_output_tokens).toBe(200);
  });

  it('converts provider HTTP errors into a generic domain error', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: 'provider secret details' } }), {
          status: 429,
        }),
    );
    const analyzer = new VisionDishAnalyzer(createConfig(), fetchMock as typeof fetch);

    const error = await analyzer.analyze(INPUT).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DishAnalyzerError);
    expect(error).toMatchObject({
      failure: 'UNAVAILABLE',
      code: 'ANALYSIS_UNAVAILABLE',
      status: 503,
    });
    expect(String(error)).not.toContain('provider secret details');
    expect(String(error)).not.toContain('429');
  });

  it('converts malformed provider output into a generic domain error', async () => {
    const fetchMock = vi.fn(async () => createProviderResponse({ calories: 'unknown' }));
    const analyzer = new VisionDishAnalyzer(createConfig(), fetchMock as typeof fetch);

    await expect(analyzer.analyze(INPUT)).rejects.toMatchObject({
      failure: 'INVALID_RESPONSE',
      code: 'ANALYSIS_UNAVAILABLE',
    });
  });

  it('aborts the provider request after the configured timeout', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit): Promise<Response> =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const analyzer = new VisionDishAnalyzer(createConfig(50), fetchMock as typeof fetch);

    const result = analyzer.analyze(INPUT);
    const expectation = expect(result).rejects.toMatchObject({
      failure: 'TIMEOUT',
      code: 'ANALYSIS_TIMEOUT',
      status: 504,
    });
    await vi.advanceTimersByTimeAsync(50);

    await expectation;
  });
});
