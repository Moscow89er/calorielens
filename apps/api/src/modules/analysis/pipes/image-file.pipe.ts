import { Injectable, type PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import type { UploadedImage } from '../types/uploaded-image.type';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class ImageFilePipe implements PipeTransform<UploadedImage | undefined, UploadedImage> {
  transform(file: UploadedImage | undefined): UploadedImage {
    if (!file) {
      throw new UnprocessableEntityException('Добавьте изображение блюда');
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new UnprocessableEntityException('Размер изображения не должен превышать 5 МБ');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !this.matchesSignature(file)) {
      throw new UnprocessableEntityException('Поддерживаются только JPEG, PNG и WebP');
    }

    return file;
  }

  private matchesSignature(file: UploadedImage): boolean {
    switch (file.mimetype) {
      case 'image/jpeg':
        return (
          file.buffer.length >= 3 &&
          file.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        );
      case 'image/png':
        return (
          file.buffer.length >= 8 &&
          file.buffer
            .subarray(0, 8)
            .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        );
      case 'image/webp':
        return (
          file.buffer.length >= 12 &&
          file.buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          file.buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      default:
        return false;
    }
  }
}
