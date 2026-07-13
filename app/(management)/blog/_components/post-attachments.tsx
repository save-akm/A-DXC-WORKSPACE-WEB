'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Paperclip, Upload, Trash2, Loader2, FileText, FileSpreadsheet,
  FileArchive, ImageIcon, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { fetchAttachments, uploadAttachment, deleteAttachment } from '@/lib/api/blog';
import {
  type Attachment, type AttachmentFileType,
  fmtFileSize, humanizeBlogError,
} from '@/lib/blog/types';
import { fmtDate } from './blog-meta';

const FILE_ICONS: Record<AttachmentFileType, typeof FileText> = {
  IMAGE: ImageIcon,
  PDF: FileText,
  XLSX: FileSpreadsheet,
  CSV: FileSpreadsheet,
  DOCX: FileText,
  TXT: FileText,
  ZIP: FileArchive,
  OTHER: Paperclip,
};

interface PostAttachmentsProps {
  postId: string;
  canManage: boolean;
  className?: string;
}

export function PostAttachments({ postId, canManage, className }: PostAttachmentsProps) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAttachments(postId)
      .then(setItems)
      .catch(() => { /* non-fatal on read page */ })
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const created = await uploadAttachment(postId, file);
      setItems((prev) => [...prev, created]);
      toast.success('อัปโหลดไฟล์แล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [postId]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAttachment(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast.success('ลบไฟล์แนบแล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setDeletingId(null);
    }
  }, []);

  // Inline content images are uploaded as attachments too — hide them here so
  // the list shows only true file attachments (PDF, ZIP, DOCX, …).
  const visibleItems = items.filter((a) => a.fileType !== 'IMAGE');

  if (loading && items.length === 0) {
    return (
      <section className={cn('rounded-2xl bg-card p-5 ring-1 ring-foreground/10', className)}>
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
      </section>
    );
  }

  if (!canManage && visibleItems.length === 0) return null;

  return (
    <section className={cn('rounded-2xl bg-card p-5 ring-1 ring-foreground/10', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-brand" />
          <h2 className="text-sm font-semibold text-foreground">
            ไฟล์แนบ{visibleItems.length > 0 && <span className="ml-1.5 font-normal text-muted-foreground">({visibleItems.length})</span>}
          </h2>
        </div>
        {canManage && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload className="size-3.5" />}
              อัปโหลด
            </Button>
          </>
        )}
      </div>

      {visibleItems.length === 0 ? (
        canManage ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center transition-colors hover:border-brand/40 hover:bg-muted/30"
          >
            <Upload className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">ลากไฟล์หรือคลิกเพื่ออัปโหลด (สูงสุด 25 MB)</p>
          </button>
        ) : null
      ) : (
        <ul className="space-y-2">
          {visibleItems.map((a) => {
            const Icon = FILE_ICONS[a.fileType] ?? Paperclip;
            const busy = deletingId === a.id;
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{a.fileName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtFileSize(a.fileSizeBytes)} · {fmtDate(a.uploadedAt)}
                  </p>
                </div>
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-[2] inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="ดาวน์โหลด"
                >
                  <Download className="size-4" />
                </a>
                {canManage && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(a.id)}
                    className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="ลบไฟล์"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
