import { AnalysisSource } from '@calorielens/shared';
import type { ConfigService } from '@nestjs/config';
import type { DishAnalyzer, DishAnalyzerInput, DishAnalyzerResult } from '../domain/dish-analyzer';
import { DishAnalyzerError } from '../domain/dish-analyzer.error';

type FetchImplementation = typeof fetch;

type VisionResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type VisionResultPayload = {
  dishName?: unknown;
  calories?: unknown;
  confidence?: unknown;
};

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    dishName: { type: 'string', minLength: 1, maxLength: 120 },
    calories: { type: 'integer', minimum: 0, maximum: 5000 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['dishName', 'calories', 'confidence'],
  additionalProperties: false,
} as const;

export class VisionDishAnalyzer implements DishAnalyzer {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(
    configService: ConfigService,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {
    this.apiKey = configService.getOrThrow<string>('VISION_API_KEY');
    this.apiUrl = configService.getOrThrow<string>('VISION_API_URL');
    this.model = configService.getOrThrow<string>('VISION_MODEL');
    this.timeoutMs = configService.getOrThrow<number>('VISION_TIMEOUT_MS');
  }

  async analyze(input: DishAnalyzerInput): Promise<DishAnalyzerResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImplementation(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.createRequestBody(input)),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw DishAnalyzerError.unavailable();
      }

      const payload = (await response.json()) as VisionResponse;
      return this.parseResponse(payload);
    } catch (error) {
      if (error instanceof DishAnalyzerError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw DishAnalyzerError.timeout();
      }

      throw DishAnalyzerError.unavailable();
    } finally {
      clearTimeout(timeout);
    }
  }

  private createRequestBody({ buffer, mimeType }: DishAnalyzerInput) {
    const imageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return {
      model: this.model,
      store: false,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                'Определи основное блюдо на фотографии.',
                'Оцени суммарную калорийность видимой порции.',
                'Верни краткое название блюда на русском языке и уверенность от 0 до 1.',
              ].join(' '),
            },
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: 'low',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'dish_analysis',
          strict: true,
          schema: RESULT_SCHEMA,
        },
      },
      reasoning: { effort: 'none' },
      max_output_tokens: 200,
    };
  }

  private parseResponse(payload: VisionResponse): DishAnalyzerResult {
    const outputText = payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === 'output_text')?.text;

    if (!outputText) {
      throw DishAnalyzerError.invalidResponse();
    }

    let result: VisionResultPayload;

    try {
      result = JSON.parse(outputText) as VisionResultPayload;
    } catch {
      throw DishAnalyzerError.invalidResponse();
    }

    if (
      typeof result.dishName !== 'string' ||
      result.dishName.trim().length === 0 ||
      result.dishName.length > 120 ||
      typeof result.calories !== 'number' ||
      !Number.isInteger(result.calories) ||
      result.calories < 0 ||
      result.calories > 5000 ||
      typeof result.confidence !== 'number' ||
      result.confidence < 0 ||
      result.confidence > 1
    ) {
      throw DishAnalyzerError.invalidResponse();
    }

    return {
      dishName: result.dishName.trim(),
      calories: result.calories,
      confidence: result.confidence,
      source: AnalysisSource.VISION,
    };
  }
}
