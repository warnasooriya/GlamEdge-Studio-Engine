import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as presignUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env";
import { StorageProvider } from "./StorageProvider";

const SIGNED_URL_EXPIRY_SECONDS = 3600;

export class S3Storage implements StorageProvider {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.aws.region,
      credentials: {
        accessKeyId: env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey,
      },
    });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return this.getUrl(key);
  }

  getUrl(key: string): string {
    if (env.aws.cloudfrontUrl) {
      return `${env.aws.cloudfrontUrl.replace(/\/$/, "")}/${key}`;
    }
    return `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
  }

  // The bucket has ACLs disabled (the modern S3 "bucket owner enforced" default), so
  // objects aren't publicly readable via their plain URL — presign a temporary one instead.
  async getSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: env.aws.bucket, Key: key });
    return presignUrl(this.client, command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  }

  async resolveUrl(storedUrl: string): Promise<string> {
    const prefix = this.getUrl("");
    // Only re-sign URLs that are actually ours (this bucket/CDN) — a URL from another origin
    // (e.g. a local-disk URL left over from before S3 was configured) isn't an S3 key of ours,
    // so re-deriving one from its path would presign garbage. Pass those through unchanged.
    if (!storedUrl.startsWith(prefix)) return storedUrl;
    const key = storedUrl.slice(prefix.length);
    return this.getSignedUrl(key);
  }
}
