import fs from "fs/promises";
import path from "path";
import { env } from "@/config/env";
import { StorageProvider } from "./StorageProvider";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

export class LocalDiskStorage implements StorageProvider {
  async upload(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(UPLOADS_DIR, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return this.getUrl(key);
  }

  getUrl(key: string): string {
    return `${env.publicUrl}/uploads/${key}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    // Local disk files are already served publicly via express.static — no signing needed.
    return this.getUrl(key);
  }

  async resolveUrl(storedUrl: string): Promise<string> {
    // URLs are stored absolute, so rows written under a different origin (an older
    // localhost dev run, or the stack before it moved behind a proxy) would point at
    // a host the browser can't reach. Re-point any /uploads URL at the current base.
    const match = /^https?:\/\/[^/]+(\/uploads\/.*)$/.exec(storedUrl);
    if (match) return `${env.publicUrl}${match[1]}`;
    return storedUrl;
  }
}
