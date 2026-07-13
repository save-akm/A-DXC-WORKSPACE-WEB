'use client';

import { useRef } from 'react';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COVER_IMAGE_ACCEPT } from '@/lib/blog/cover-validation';

interface PostCoverPickerProps {
  previewUrl: string | null;
  uploading?: boolean;
  disabled?: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}

export function PostCoverPicker({
  previewUrl,
  uploading = false,
  disabled = false,
  onPick,
  onRemove,
}: PostCoverPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = disabled || uploading;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={COVER_IMAGE_ACCEPT.join(',')}
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = '';
        }}
      />

      <div className="relative mb-2 aspect-video overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="ตัวอย่างรูปปก" className="size-full object-cover" />
            {!busy && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute right-2 top-2 inline-flex size-7 cursor-pointer items-center justify-center rounded-lg bg-black/55 text-white transition-colors hover:bg-black/70"
                title="ลบรูปปก"
              >
                <X className="size-3.5" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 text-muted-foreground/60 transition-colors',
              'hover:bg-muted/40 hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            <span className="text-[11px]">{uploading ? 'กำลังอัปโหลด…' : 'คลิกเพื่อเลือกรูปปก'}</span>
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus className="size-3.5" />
            เปลี่ยนรูป
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="size-3.5" />
            ลบ
          </button>
        </div>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground">JPG, PNG, WEBP · สูงสุด 10 MB</p>
    </div>
  );
}
