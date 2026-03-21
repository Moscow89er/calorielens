import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { CommonModule } from './common/common.module';
import { AdminModule } from './modules/admin/admin.module';
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
      }),
    }),
    CommonModule,
    HealthModule,
    AdminModule,
    AnalysisModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
