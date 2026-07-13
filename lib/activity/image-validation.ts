import { ACTIVITY_IMAGE_ACCEPT } from '@/lib/activity/types';

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function hasAllowedType(file: File): boolean {
  if (file.type && ACTIVITY_IMAGE_ACCEPT.includes(file.type as (typeof ACTIVITY_IMAGE_ACCEPT)[number])) {
    return true;
  }
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  return EXTENSIONS.has(ext);
}

export function validateActivityImageFile(file: File): string | null {
  if (!file.size) {
    return 'ไฟล์ว่าง';
  }
  if (!hasAllowedType(file)) {
    return 'รองรับเฉพาะ JPG, PNG, WEBP';
  }
  return null;
}

export function assertActivityImageFile(file: File): void {
  const message = validateActivityImageFile(file);
  if (message) {
    const err = new Error(message) as Error & { code: string };
    err.code = 'INVALID_FILE_TYPE';
    throw err;
  }
}

export function partitionActivityImageFiles(files: File[]): {
  valid: File[];
  rejected: { file: File; reason: string }[];
} {
  const valid: File[] = [];
  const rejected: { file: File; reason: string }[] = [];
  for (const file of files) {
    const reason = validateActivityImageFile(file);
    if (reason) rejected.push({ file, reason });
    else valid.push(file);
  }
  return { valid, rejected };
}
