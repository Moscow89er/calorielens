export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

export interface ImageStorage {
  save(buffer: Buffer, mimeType: string): Promise<string>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
