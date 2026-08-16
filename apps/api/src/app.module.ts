import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { CommonModule } from './common/common.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().min(1).required(),
        DATABASE_URL: Joi.string().min(1).required(),
        JWT_EXPIRES_IN: Joi.string()
          .pattern(/^\d+(ms|s|m|h|d|w|y)$/)
          .default('7d'),
        BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(31).default(10),
        DISH_ANALYZER: Joi.string().valid('demo', 'vision').default('demo'),
        VISION_API_KEY: Joi.when('DISH_ANALYZER', {
          is: 'vision',
          // biome-ignore lint/suspicious/noThenProperty: `then` is part of Joi's conditional schema API.
          then: Joi.string().min(1).required(),
          otherwise: Joi.string().allow('').optional(),
        }),
        VISION_API_URL: Joi.string().uri().default('https://api.openai.com/v1/responses'),
        VISION_MODEL: Joi.string().min(1).default('gpt-5.6-luna'),
        VISION_TIMEOUT_MS: Joi.number().integer().min(1000).max(60000).default(15000),
        UPLOAD_DIR: Joi.string().min(1).default('./uploads'),
      }),
    }),
    CommonModule,
    HealthModule,
    AnalysisModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
