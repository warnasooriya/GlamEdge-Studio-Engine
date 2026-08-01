export interface StorageProvider {
  /** Uploads a buffer and returns a publicly accessible URL. */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
}
