export interface StorageProvider {
  /** Uploads a buffer and returns a publicly accessible URL. */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  /** Returns the publicly accessible URL for a previously uploaded key, without re-uploading. */
  getUrl(key: string): string;
}
