import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ImageStorage } from './image-storage';

const FILE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SAFE_IMAGE_KEY = /^[0-9a-f-]+\.(jpg|png|webp)$/;

@Injectable()
export class LocalImageStorage implements ImageStorage {
  private readonly rootDirectory: string;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.rootDirectory = resolve(configService.getOrThrow<string>('UPLOAD_DIR'));
  }

  async save(buffer: Buffer, mimeType: string): Promise<string> {
    const extension = FILE_EXTENSIONS[mimeType];

    if (!extension) {
      throw new Error('Unsupported image MIME type');
    }

    const key = `${randomUUID()}.${extension}`;
    await mkdir(this.rootDirectory, { recursive: true });
    await writeFile(this.resolveKey(key), buffer, { flag: 'wx' });
    return key;
  }

  read(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key));
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch (error) {
      if (this.isFileMissing(error)) {
        return;
      }

      throw error;
    }
  }

  private resolveKey(key: string): string {
    if (!SAFE_IMAGE_KEY.test(key)) {
      throw new Error('Invalid image key');
    }

    return resolve(this.rootDirectory, key);
  }

  private isFileMissing(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }
}
