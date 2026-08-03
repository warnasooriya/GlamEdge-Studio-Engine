export interface StorageProvider {
  /** Uploads a buffer and returns a URL for the object (may not be directly browsable — see getSignedUrl). */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  /** Returns a canonical URL for a previously uploaded key, without re-uploading. */
  getUrl(key: string): string;
  /** Returns a time-limited, directly browsable URL for a previously uploaded key. */
  getSignedUrl(key: string): Promise<string>;
  /** Given a URL previously returned by upload()/getUrl() (possibly not directly browsable), returns a currently-browsable URL. */
  resolveUrl(storedUrl: string): Promise<string>;
}
