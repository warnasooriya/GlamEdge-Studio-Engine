import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { StorageProvider } from "./StorageProvider";

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
}
