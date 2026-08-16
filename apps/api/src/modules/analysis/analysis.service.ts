import {
  type AnalysisListResponse,
  type AnalysisResult,
  AnalysisSource,
} from '@calorielens/shared';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Analysis } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DISH_ANALYZER, type DishAnalyzer } from './domain/dish-analyzer';
import type { ListAnalysesQueryDto } from './dto/list-analyses-query.dto';
import { IMAGE_STORAGE, type ImageStorage } from './storage/image-storage';
import type { UploadedImage } from './types/uploaded-image.type';

type AnalysisCursorPayload = {
  createdAt: string;
  id: string;
};

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DISH_ANALYZER) private readonly dishAnalyzer: DishAnalyzer,
    @Inject(IMAGE_STORAGE) private readonly imageStorage: ImageStorage,
  ) {}

  async create(userId: string, image: UploadedImage): Promise<AnalysisResult> {
    const result = await this.dishAnalyzer.analyze({
      buffer: image.buffer,
      mimeType: image.mimetype,
    });
    const imageKey = await this.imageStorage.save(image.buffer, image.mimetype);

    try {
      const analysis = await this.prisma.analysis.create({
        data: {
          userId,
          imageKey,
          imageMimeType: image.mimetype,
          dishName: result.dishName,
          calories: result.calories,
          confidence: result.confidence,
          source: result.source,
        },
      });

      return this.toResult(analysis);
    } catch (error) {
      try {
        await this.imageStorage.remove(imageKey);
      } catch (cleanupError) {
        const cleanupStack = cleanupError instanceof Error ? cleanupError.stack : undefined;
        this.logger.warn(
          `Failed to remove image ${imageKey} after database write failure`,
          cleanupStack,
        );
      }

      throw error;
    }
  }

  async list(userId: string, query: ListAnalysesQueryDto): Promise<AnalysisListResponse> {
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : null;

    if (cursor) {
      const cursorExists = await this.prisma.analysis.findFirst({
        where: { id: cursor.id, userId, createdAt: cursor.createdAt },
        select: { id: true },
      });

      if (!cursorExists) {
        throw new BadRequestException('Некорректный cursor');
      }
    }

    const analyses = await this.prisma.analysis.findMany({
      where: {
        userId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    const hasNextPage = analyses.length > query.limit;
    const page = hasNextPage ? analyses.slice(0, query.limit) : analyses;

    return {
      items: page.map((analysis) => this.toResult(analysis)),
      nextCursor: hasNextPage ? this.encodeCursor(page.at(-1)) : null,
    };
  }

  async getById(userId: string, analysisId: string): Promise<AnalysisResult> {
    return this.toResult(await this.findOwned(userId, analysisId));
  }

  async getImage(
    userId: string,
    analysisId: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const analysis = await this.findOwned(userId, analysisId);
    const buffer = await this.imageStorage.read(analysis.imageKey);
    return { buffer, mimeType: analysis.imageMimeType };
  }

  async delete(userId: string, analysisId: string): Promise<void> {
    const analysis = await this.findOwned(userId, analysisId);
    await this.prisma.analysis.delete({ where: { id: analysis.id } });

    try {
      await this.imageStorage.remove(analysis.imageKey);
    } catch {
      this.logger.warn(`Failed to remove image ${analysis.imageKey} after deleting analysis`);
    }
  }

  private async findOwned(userId: string, analysisId: string): Promise<Analysis> {
    const analysis = await this.prisma.analysis.findFirst({
      where: { id: analysisId, userId },
    });

    if (!analysis) {
      throw new NotFoundException('Результат анализа не найден');
    }

    return analysis;
  }

  private encodeCursor(analysis: Pick<Analysis, 'createdAt' | 'id'> | undefined): string | null {
    if (!analysis) {
      return null;
    }

    const payload: AnalysisCursorPayload = {
      createdAt: analysis.createdAt.toISOString(),
      id: analysis.id,
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  private decodeCursor(cursor: string): { createdAt: Date; id: string } {
    try {
      const payload: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));

      if (!this.isCursorPayload(payload)) {
        throw new Error('Invalid cursor payload');
      }

      const createdAt = new Date(payload.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('Invalid cursor date');
      }

      return { createdAt, id: payload.id };
    } catch {
      throw new BadRequestException('Некорректный cursor');
    }
  }

  private isCursorPayload(value: unknown): value is AnalysisCursorPayload {
    return (
      typeof value === 'object' &&
      value !== null &&
      'createdAt' in value &&
      typeof value.createdAt === 'string' &&
      'id' in value &&
      typeof value.id === 'string' &&
      value.id.length > 0
    );
  }

  private toResult(analysis: Analysis): AnalysisResult {
    return {
      id: analysis.id,
      dishName: analysis.dishName,
      calories: analysis.calories,
      confidence: analysis.confidence,
      source:
        analysis.source === AnalysisSource.VISION ? AnalysisSource.VISION : AnalysisSource.DEMO,
      imageUrl: `/api/analyses/${analysis.id}/image`,
      createdAt: analysis.createdAt.toISOString(),
    };
  }
}
