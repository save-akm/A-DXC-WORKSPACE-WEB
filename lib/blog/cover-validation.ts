const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export const COVER_IMAGE_ACCEPT = ACCEPT;
export const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024;

function hasAllowedType(file: File): boolean {
  if (file.type && ACCEPT.includes(file.type as (typeof ACCEPT)[number])) return true;
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  return EXTENSIONS.has(ext);
}

export function validateCoverImageFile(file: File): string | null {
  if (!file.size) return 'ไฟล์ว่าง';
  if (!hasAllowedType(file)) return 'รองรับเฉพาะ JPG, PNG, WEBP';
  if (file.size > MAX_COVER_SIZE_BYTES) return 'ไฟล์ใหญ่เกิน 10 MB';
  return null;
}
