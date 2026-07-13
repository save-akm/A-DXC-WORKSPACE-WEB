'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Markdown } from '@/app/(management)/blog/_components/markdown';

const MODES = [
  { key: 'write', label: 'เขียน' },
  { key: 'preview', label: 'พรีวิว' },
] as const;

type Mode = (typeof MODES)[number]['key'];

interface MdFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** When provided, shows an inline-image upload button (needs an existing survey id). */
  onUploadImage?: (file: File) => Promise<{ url: string }>;
  className?: string;
}

/**
 * Markdown textarea with a write/preview toggle. Inline image upload appends
 * `![ชื่อไฟล์](url)` at the caret — available only in edit mode (the content-images
 * endpoint requires an existing survey id).
 */
export function MdField({
  id, label, hint, value, onChange, placeholder, disabled, onUploadImage, className,
}: MdFieldProps) {
  const [mode, setMode] = useState<Mode>('write');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!onUploadImage) return;
    setUploading(true);
    try {
      const { url } = await onUploadImage(file);
      const snippet = `![${file.name.replace(/\.[^.]+$/, '')}](${url})`;
      const el = textareaRef.current;
      if (el && document.activeElement === el) {
        const { selectionStart: s, selectionEnd: e } = el;
        onChange(`${value.slice(0, s)}${snippet}${value.slice(e)}`);
      } else {
        onChange(value ? `${value}\n\n${snippet}` : snippet);
      }
      toast.success('แทรกรูปแล้ว');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <label htmlFor={id} className="text-sm font-medium">{label}</label>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          {onUploadImage && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                แทรกรูป
              </button>
            </>
          )}

          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                  mode === m.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {mode === m.key && (
                  <motion.span
                    layoutId={`md-mode-${id}`}
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'write' ? (
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={7}
          className="min-h-32 font-mono text-[13px] leading-relaxed"
        />
      ) : (
        <div className="min-h-32 rounded-lg border border-border bg-background px-4 py-3">
          {value.trim() ? (
            <Markdown content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">ยังไม่มีเนื้อหา</p>
          )}
        </div>
      )}
    </div>
  );
}
