import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/common/prisma/prisma.service';
import { AnalysisService } from '../src/modules/analysis/analysis.service';
import type { DishAnalyzer } from '../src/modules/analysis/domain/dish-analyzer';
import { DishAnalyzerError } from '../src/modules/analysis/domain/dish-analyzer.error';
import type { ImageStorage } from '../src/modules/analysis/storage/image-storage';
import { createAnalysis, JPEG_BUFFER } from './helpers/fixtures';

const IMAGE = {
  buffer: JPEG_BUFFER,
  mimetype: 'image/jpeg',
  originalname: 'dish.jpg',
  size: JPEG_BUFFER.length,
};

describe('AnalysisService', () => {
  const prisma = {
    analysis: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  };
  const dishAnalyzer: DishAnalyzer = {
    analyze: vi.fn(),
  };
  const imageStorage: ImageStorage = {
    save: vi.fn(),
    read: vi.fn(),
    remove: vi.fn(),
  };
  const service = new AnalysisService(
    prisma as unknown as PrismaService,
    dishAnalyzer,
    imageStorage,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dishAnalyzer.analyze).mockResolvedValue({
      dishName: 'Овощной салат',
      calories: 240,
      confidence: 0.87,
      source: 'DEMO',
    });
    vi.mocked(imageStorage.save).mockResolvedValue('11111111-1111-4111-8111-111111111111.jpg');
    vi.mocked(imageStorage.remove).mockResolvedValue();
  });

  it('persists a successful analysis and exposes a protected image URL', async () => {
    prisma.analysis.create.mockResolvedValue(createAnalysis());

    await expect(service.create('user-1', IMAGE)).resolves.toMatchObject({
      id: 'analysis-1',
      source: 'DEMO',
      imageUrl: '/api/analyses/analysis-1/image',
    });
    expect(prisma.analysis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', imageMimeType: 'image/jpeg' }),
    });
  });

  it('does not write a file or database row when analysis fails', async () => {
    vi.mocked(dishAnalyzer.analyze).mockRejectedValue(DishAnalyzerError.timeout());

    await expect(service.create('user-1', IMAGE)).rejects.toMatchObject({
      code: 'ANALYSIS_TIMEOUT',
    });
    expect(imageStorage.save).not.toHaveBeenCalled();
    expect(prisma.analysis.create).not.toHaveBeenCalled();
  });

  it('removes the saved file when the database write fails', async () => {
    prisma.analysis.create.mockRejectedValue(new Error('database unavailable'));

    await expect(service.create('user-1', IMAGE)).rejects.toThrow('database unavailable');
    expect(imageStorage.remove).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111.jpg');
  });

  it('logs a failed cleanup without replacing the database error', async () => {
    const databaseError = new Error('database unavailable');
    const cleanupError = new Error('filesystem unavailable');
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    prisma.analysis.create.mockRejectedValue(databaseError);
    vi.mocked(imageStorage.remove).mockRejectedValue(cleanupError);

    try {
      await expect(service.create('user-1', IMAGE)).rejects.toBe(databaseError);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('after database write failure'),
        cleanupError.stack,
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('returns not found instead of exposing another user analysis', async () => {
    prisma.analysis.findFirst.mockResolvedValue(null);

    await expect(service.getById('user-1', 'foreign-analysis')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.analysis.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-analysis', userId: 'user-1' },
    });
  });

  it('does not read another user image', async () => {
    prisma.analysis.findFirst.mockResolvedValue(null);

    await expect(service.getImage('user-1', 'foreign-analysis')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(imageStorage.read).not.toHaveBeenCalled();
  });

  it('does not delete another user analysis or image', async () => {
    prisma.analysis.findFirst.mockResolvedValue(null);

    await expect(service.delete('user-1', 'foreign-analysis')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.analysis.delete).not.toHaveBeenCalled();
    expect(imageStorage.remove).not.toHaveBeenCalled();
  });

  it('rejects a cursor that does not belong to the current user', async () => {
    prisma.analysis.findFirst.mockResolvedValue(null);
    const cursor = Buffer.from(
      JSON.stringify({ createdAt: '2026-08-16T10:00:00.000Z', id: 'foreign-cursor' }),
    ).toString('base64url');

    await expect(service.list('user-1', { cursor, limit: 20 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.analysis.findMany).not.toHaveBeenCalled();
  });

  it('paginates equal timestamps by createdAt and id without duplicates or gaps', async () => {
    const sameCreatedAt = new Date('2026-08-16T10:00:00.000Z');
    const olderCreatedAt = new Date('2026-08-15T10:00:00.000Z');
    prisma.analysis.findMany
      .mockResolvedValueOnce([
        createAnalysis({ id: 'analysis-3', createdAt: sameCreatedAt }),
        createAnalysis({ id: 'analysis-2', createdAt: sameCreatedAt }),
        createAnalysis({ id: 'analysis-1', createdAt: sameCreatedAt }),
      ])
      .mockResolvedValueOnce([
        createAnalysis({ id: 'analysis-1', createdAt: sameCreatedAt }),
        createAnalysis({ id: 'analysis-0', createdAt: olderCreatedAt }),
      ]);
    prisma.analysis.findFirst.mockResolvedValue({ id: 'analysis-2' });

    const firstPage = await service.list('user-1', { limit: 2 });
    expect(firstPage.items.map(({ id }) => id)).toEqual(['analysis-3', 'analysis-2']);
    expect(firstPage.nextCursor).toEqual(expect.any(String));
    expect(firstPage.nextCursor).not.toBe('analysis-2');

    if (!firstPage.nextCursor) {
      throw new Error('Expected a next cursor');
    }

    const secondPage = await service.list('user-1', {
      cursor: firstPage.nextCursor,
      limit: 2,
    });

    expect(prisma.analysis.findFirst).toHaveBeenCalledWith({
      where: { id: 'analysis-2', userId: 'user-1', createdAt: sameCreatedAt },
      select: { id: true },
    });
    expect(prisma.analysis.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        userId: 'user-1',
        OR: [
          { createdAt: { lt: sameCreatedAt } },
          { createdAt: sameCreatedAt, id: { lt: 'analysis-2' } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 3,
    });

    const combinedIds = [...firstPage.items, ...secondPage.items].map(({ id }) => id);
    expect(combinedIds).toEqual(['analysis-3', 'analysis-2', 'analysis-1', 'analysis-0']);
    expect(new Set(combinedIds).size).toBe(combinedIds.length);
    expect(secondPage.nextCursor).toBeNull();
  });
});
