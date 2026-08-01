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
    return `http://localhost:${env.port}/uploads/${key}`;
  }
}
