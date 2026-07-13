'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, FileSpreadsheet, FileText, Loader2, Paperclip, Trash2, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { deleteAttachment, uploadAttachment } from '@/lib/api/project-surveys';
import type { SurveyAttachment, SurveyFileType } from '@/lib/project-survey/types';
import { formatFileSize, fullName } from '@/lib/project-survey/labels';

const ACCEPT = '.pdf,.docx,.xlsx,.csv,.txt';

const FILE_ICON: Record<SurveyFileType, typeof FileText> = {
  PDF: FileText,
  DOCX: FileText,
  TXT: FileText,
  XLSX: FileSpreadsheet,
  CSV: FileSpreadsheet,
};

interface AttachmentsPanelProps {
  surveyId: string;
  attachments: SurveyAttachment[];
  onChange: (next: SurveyAttachment[]) => void;
  /** USER while SEND, or A-DXC while REVIEW. */
  canUpload: boolean;
}

export function AttachmentsPanel({ surveyId, attachments, onChange, canUpload }: AttachmentsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const created = await uploadAttachment(surveyId, file);
      onChange([...attachments, created]);
      toast.success(`อัปโหลด "${file.name}" แล้ว`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปโหลดไฟล์ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(att: SurveyAttachment) {
    setDeletingId(att.id);
    try {
      await deleteAttachment(surveyId, att.id);
      onChange(attachments.filter((a) => a.id !== att.id));
      toast.success(`ลบ "${att.fileName}" แล้ว`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบไฟล์ไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip size={15} className="text-muted-foreground" />
          ไฟล์แนบ
          {attachments.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {attachments.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {attachments.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
        ) : (
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {attachments.map((att) => {
                const Icon = FILE_ICON[att.fileType] ?? FileText;
                return (
                  <motion.li
                    key={att.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={att.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[13px] font-medium hover:text-brand hover:underline"
                        title={att.fileName}
                      >
                        {att.fileName}
                      </a>
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {formatFileSize(att.fileSizeBytes)}
                        {att.uploadedBy && <> · {fullName(att.uploadedBy)}</>}
                        {att.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-0.5 text-destructive">
                            <AlertCircle size={10} />ประมวลผลไม่สำเร็จ
                          </span>
                        )}
                        {(att.status === 'PENDING' || att.status === 'PROCESSING') && (
                          <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                            <Loader2 size={10} className="animate-spin" />กำลังประมวลผล
                          </span>
                        )}
                      </p>
                    </div>
                    {canUpload && (
                      <button
                        type="button"
                        onClick={() => handleDelete(att)}
                        disabled={deletingId === att.id}
                        aria-label={`ลบ ${att.fileName}`}
                        className={cn(
                          'shrink-0 cursor-pointer text-muted-foreground/50 opacity-0 transition-opacity',
                          'hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100',
                        )}
                      >
                        {deletingId === att.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        {canUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
                e.target.value = '';
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              อัปโหลดไฟล์ (PDF, Word, Excel, CSV, TXT)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
