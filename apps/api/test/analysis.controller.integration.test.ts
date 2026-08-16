import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { AnalysisController } from '../src/modules/analysis/analysis.controller';
import { AnalysisService } from '../src/modules/analysis/analysis.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { JPEG_BUFFER } from './helpers/fixtures';

describe('AnalysisController integration', () => {
  let app: INestApplication;
  const analysisService = {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    getImage: vi.fn(),
    delete: vi.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [{ provide: AnalysisService, useValue: analysisService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: unknown } };
        }) => {
          context.switchToHttp().getRequest().user = {
            id: 'user-1',
            email: 'user@example.com',
            role: 'USER',
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid multipart image without exercising bearer auth internals', async () => {
    analysisService.create.mockResolvedValue({
      id: 'analysis-1',
      dishName: 'Овощной салат',
      calories: 240,
      confidence: 0.87,
      source: 'DEMO',
      imageUrl: '/api/analyses/analysis-1/image',
      createdAt: '2026-08-16T10:00:00.000Z',
    });

    const response = await request(app.getHttpServer())
      .post('/api/analyses')
      .attach('image', JPEG_BUFFER, { filename: 'dish.jpg', contentType: 'image/jpeg' })
      .expect(201);

    expect(response.body).toMatchObject({ id: 'analysis-1', source: 'DEMO' });
    expect(analysisService.create).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ mimetype: 'image/jpeg' }),
    );
  });

  it('returns the shared validation envelope for an invalid page limit', async () => {
    const response = await request(app.getHttpServer()).get('/api/analyses?limit=51').expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ошибка валидации данных',
      },
    });
    expect(analysisService.list).not.toHaveBeenCalled();
  });
});
