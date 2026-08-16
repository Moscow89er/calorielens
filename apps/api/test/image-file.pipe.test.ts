import { UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ImageFilePipe, MAX_IMAGE_SIZE_BYTES } from '../src/modules/analysis/pipes/image-file.pipe';
import type { UploadedImage } from '../src/modules/analysis/types/uploaded-image.type';
import { JPEG_BUFFER } from './helpers/fixtures';

function createImage(overrides: Partial<UploadedImage> = {}): UploadedImage {
  return {
    buffer: JPEG_BUFFER,
    mimetype: 'image/jpeg',
    originalname: 'dish.jpg',
    size: JPEG_BUFFER.length,
    ...overrides,
  };
}

describe('ImageFilePipe', () => {
  const pipe = new ImageFilePipe();

  it('rejects a missing file', () => {
    expect(() => pipe.transform(undefined)).toThrow(UnprocessableEntityException);
  });

  it('rejects an unsupported MIME type', () => {
    expect(() => pipe.transform(createImage({ mimetype: 'image/gif' }))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('rejects content whose signature does not match its MIME type', () => {
    expect(() =>
      pipe.transform(createImage({ buffer: Buffer.from('not-a-jpeg'), size: 10 })),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects an image larger than 5 MB', () => {
    const buffer = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1);
    JPEG_BUFFER.copy(buffer);

    expect(() => pipe.transform(createImage({ buffer, size: buffer.length }))).toThrow(
      UnprocessableEntityException,
    );
  });
});
