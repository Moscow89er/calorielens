import type { AnalysisListResponse, AnalysisResult } from '@calorielens/shared';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CurrentUser as CurrentUserType } from '../auth/types/current-user.type';
import { AnalysisService } from './analysis.service';
// biome-ignore lint/style/useImportType: Nest validation needs the DTO constructor at runtime.
import { ListAnalysesQueryDto } from './dto/list-analyses-query.dto';
import { ImageFilePipe, MAX_IMAGE_SIZE_BYTES } from './pipes/image-file.pipe';
import type { UploadedImage } from './types/uploaded-image.type';

@Controller('analyses')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(@Inject(AnalysisService) private readonly analysisService: AnalysisService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  create(
    @CurrentUser() user: CurrentUserType,
    @UploadedFile(ImageFilePipe) image: UploadedImage,
  ): Promise<AnalysisResult> {
    return this.analysisService.create(user.id, image);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserType,
    @Query() query: ListAnalysesQueryDto,
  ): Promise<AnalysisListResponse> {
    return this.analysisService.list(user.id, query);
  }

  @Get(':id/image')
  async getImage(
    @CurrentUser() user: CurrentUserType,
    @Param('id') analysisId: string,
  ): Promise<StreamableFile> {
    const image = await this.analysisService.getImage(user.id, analysisId);
    return new StreamableFile(image.buffer, { type: image.mimeType });
  }

  @Get(':id')
  getById(
    @CurrentUser() user: CurrentUserType,
    @Param('id') analysisId: string,
  ): Promise<AnalysisResult> {
    return this.analysisService.getById(user.id, analysisId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: CurrentUserType, @Param('id') analysisId: string): Promise<void> {
    return this.analysisService.delete(user.id, analysisId);
  }
}
