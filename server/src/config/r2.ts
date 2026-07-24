import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './index';

function getS3Client(): S3Client {
  if (!config.r2.endpoint || !config.r2.accessKeyId || !config.r2.secretAccessKey) {
    throw new Error('Cloudflare R2 credentials not configured');
  }
  return new S3Client({
    region: 'auto',
    endpoint: config.r2.endpoint,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

function getBucket(): string {
  return config.r2.bucketName;
}

function getPublicUrl(): string {
  return config.r2.publicUrl;
}

export async function uploadFile(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );
  return `${getPublicUrl()}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}

export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return s3GetSignedUrl(client, command, { expiresIn });
}

export async function uploadBase64(
  base64: string,
  key: string
): Promise<string> {
  const client = getS3Client();
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  const contentType = matches ? matches[1] : 'application/octet-stream';
  const buffer = matches
    ? Buffer.from(matches[2], 'base64')
    : Buffer.from(base64, 'base64');

  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${getPublicUrl()}/${key}`;
}
