import { uploadFile, deleteFile, getSignedUrl as r2GetSignedUrl } from '../config/r2';
import { generateId } from '../utils/helpers';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_ALL_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

export async function uploadClassFile(
  classId: string,
  file: Express.Multer.File,
  type: string = 'general'
): Promise<{ url: string; key: string; name: string; size: number }> {
  const fileId = generateId();
  const extension = file.originalname.split('.').pop() || 'bin';
  const key = `classes/${classId}/${type}/${fileId}.${extension}`;

  const url = await uploadFile(file.buffer, key, file.mimetype);

  return {
    url,
    key,
    name: file.originalname,
    size: file.size,
  };
}

export async function deleteClassFile(
  classId: string,
  fileKey: string
): Promise<void> {
  const key = `classes/${classId}/${fileKey}`;
  await deleteFile(key);
}

export async function getFileUrl(key: string): Promise<string> {
  return r2GetSignedUrl(key, 3600);
}

export async function uploadProfileImage(
  userId: string,
  file: Express.Multer.File
): Promise<string> {
  const extension = file.originalname.split('.').pop() || 'jpg';
  const key = `profiles/${userId}/${userId}.${extension}`;

  return uploadFile(file.buffer, key, file.mimetype);
}

export function validateFileType(
  file: Express.Multer.File,
  allowedTypes: string[] = ALLOWED_ALL_TYPES
): boolean {
  return allowedTypes.includes(file.mimetype);
}

export function validateFileSize(
  file: Express.Multer.File,
  maxSizeMB: number = 50
): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}
