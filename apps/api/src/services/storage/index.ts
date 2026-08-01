import { isS3Configured } from "@/config/env";
import { StorageProvider } from "./StorageProvider";
import { S3Storage } from "./S3Storage";
import { LocalDiskStorage } from "./LocalDiskStorage";

export const storageProvider: StorageProvider = isS3Configured
  ? new S3Storage()
  : new LocalDiskStorage();

export * from "./StorageProvider";
