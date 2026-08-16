import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DemoDishAnalyzer } from './adapters/demo-dish-analyzer';
import { VisionDishAnalyzer } from './adapters/vision-dish-analyzer';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { DISH_ANALYZER } from './domain/dish-analyzer';
import { IMAGE_STORAGE } from './storage/image-storage';
import { LocalImageStorage } from './storage/local-image-storage';

@Module({
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    LocalImageStorage,
    {
      provide: IMAGE_STORAGE,
      useExisting: LocalImageStorage,
    },
    {
      provide: DISH_ANALYZER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mode = configService.getOrThrow<'demo' | 'vision'>('DISH_ANALYZER');
        return mode === 'vision' ? new VisionDishAnalyzer(configService) : new DemoDishAnalyzer();
      },
    },
  ],
  exports: [AnalysisService],
})
export class AnalysisModule {}
