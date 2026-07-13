'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import {
  partitionActivityImageFiles,
  validateActivityImageFile,
} from '@/lib/activity/image-validation';
import { ACTIVITY_IMAGE_ACCEPT } from '@/lib/activity/types';
import { ImageHoverPreview } from './image-hover-preview';

const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

interface PendingFile {
  id: string;
  file: File;
  preview: string;
}

interface ActivityImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  /** Wider preview grid for full-width modal footer. */
  fullWidth?: boolean;
}

/** Queue images before activity is created — uploaded after POST /admin/activities. */
export function ActivityImagePicker({ files, onChange, disabled, fullWidth = false }: ActivityImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<PendingFile[]>([]);

  useEffect(() => {
    const next = files.map((file, i) => ({
      id: `${file.name}-${file.size}-${i}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.preview));
  }, [files]);

  function addFiles(incoming: FileList | null) {
    if (!incoming?.length || disabled) return;
    const { valid, rejected } = partitionActivityImageFiles(Array.from(incoming));
    for (const { file, reason } of rejected) {
      toast.error(`${file.name}: ${reason}`);
    }
    if (valid.length) onChange([...files, ...valid]);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className={LABEL_CLASS}>รูปภาพ</label>
      <p className="mb-2 text-[10px] text-muted-foreground">
        JPG, PNG, WEBP · รูปแรกจะเป็นรูปปกอัตโนมัติ
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACTIVITY_IMAGE_ACCEPT.join(',')}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 transition-colors',
          fullWidth ? 'px-4 py-3 sm:px-6 sm:py-4 lg:py-5' : 'flex-col gap-2 px-4 py-6',
          'hover:border-violet-400/50 hover:bg-violet-500/5 disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <ImagePlus className={cn('text-violet-500', fullWidth ? 'h-7 w-7' : 'h-6 w-6')} />
        <div className={cn(fullWidth ? 'text-left' : 'text-center')}>
          <span className="block text-[12px] font-medium text-foreground">เลือกรูปภาพ</span>
          <span className="block text-[10px] text-muted-foreground">คลิกเพื่อเลือกไฟล์ · เลือกได้หลายรูป</span>
        </div>
      </button>

      {previews.length > 0 && (
        <div
          className={cn(
            'mt-3 gap-2 sm:gap-3',
            fullWidth
              ? 'grid max-h-[min(220px,32vh)] grid-cols-2 overflow-y-auto overscroll-contain sm:max-h-[min(260px,36vh)] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'grid grid-cols-3 gap-2 sm:grid-cols-4',
          )}
        >
          {previews.map((p, i) => (
            <ImageHoverPreview
              key={p.id}
              src={p.preview}
              className="group overflow-hidden rounded-xl border border-border/60 bg-muted/30"
              imgClassName={cn(
                'w-full object-cover',
                fullWidth ? 'aspect-video' : 'aspect-square',
              )}
            >
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  ปก
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="ลบรูป"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </ImageHoverPreview>
          ))}
        </div>
      )}
    </div>
  );
}

/** Re-validate queued files right before upload (size/type guard). */
export function validatePendingActivityImages(files: File[]): string | null {
  for (const file of files) {
    const err = validateActivityImageFile(file);
    if (err) return `${file.name}: ${err}`;
  }
  return null;
}
