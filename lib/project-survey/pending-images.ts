// Local image staging for the create flow — content-images upload needs a
// survey id that doesn't exist yet, so images picked before submit are held
// as object URLs and swapped for real URLs right after the survey is created.

import { uploadContentImage } from '@/lib/api/project-surveys';
import type { CreateSurveyInput } from './types';
import { formatFileSize } from './labels';

export const MAX_CONTENT_IMAGE_BYTES = 25 * 1024 * 1024;

/** Throws a user-facing message (surfaced by MdField's existing error toast) when oversized. */
export function assertContentImageSize(file: File): void {
  if (file.size > MAX_CONTENT_IMAGE_BYTES) {
    throw new Error(
      `ไฟล์ต้องไม่เกิน ${formatFileSize(MAX_CONTENT_IMAGE_BYTES)} (ไฟล์นี้ ${formatFileSize(file.size)})`,
    );
  }
}

type MarkdownFields = Pick<CreateSurveyInput, 'request' | 'changePoint' | 'detail'>;

/**
 * Uploads each staged image against the now-created survey and swaps its blob
 * URL for the real one. A failed upload strips that image's markdown snippet
 * instead of leaving a dead blob reference. Every blob URL is revoked as it's
 * processed, whether the upload succeeded or not.
 */
export async function relinkPendingImages(
  surveyId: string,
  pending: Map<string, File>,
  fields: MarkdownFields,
): Promise<{ patch: MarkdownFields; failedCount: number }> {
  let { request, changePoint, detail } = fields;
  let failedCount = 0;

  for (const [blobUrl, file] of pending) {
    try {
      const { url } = await uploadContentImage(surveyId, file);
      request = request?.split(blobUrl).join(url);
      changePoint = changePoint?.split(blobUrl).join(url);
      detail = detail?.split(blobUrl).join(url);
    } catch {
      failedCount += 1;
      const snippet = `![${file.name.replace(/\.[^.]+$/, '')}](${blobUrl})`;
      request = request?.split(snippet).join('');
      changePoint = changePoint?.split(snippet).join('');
      detail = detail?.split(snippet).join('');
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  return { patch: { request, changePoint, detail }, failedCount };
}

/** Safety-net cleanup for cancel / navigate-away before submit. */
export function revokeAllPending(pending: Map<string, File>): void {
  for (const blobUrl of pending.keys()) URL.revokeObjectURL(blobUrl);
}
