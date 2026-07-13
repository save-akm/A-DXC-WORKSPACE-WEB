'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CloudUpload, FolderOpen, FolderPlus, Loader2, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { uploadDocument } from '@/lib/api/documents';
import type { CollectionSummary, CollectionType, DocCategory, Folder, MyDocument } from '../types';
import { ModalShell } from './modal-shell';
import { DocIcon, formatBytes, CATEGORY_LABELS } from './doc-meta';

const ACCEPTED = ['.pdf', '.docx', '.xlsx', '.csv', '.txt'];

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (doc: MyDocument, collectionId: string) => void;
  /** เมื่ออัปโหลดเข้า collection โดยตรง (หน้า collection detail) */
  collection?: { id: string; type: CollectionType; folders: Folder[] };
  /**
   * ตัวเลือก collection สำหรับหน้าหลัก — เอกสารทุกชิ้นต้องอยู่ใน collection
   * ส่งเฉพาะที่มีสิทธิ์ EDITOR ขึ้นไป
   */
  collections?: CollectionSummary[];
  /** เปิด flow สร้าง collection เมื่อยังไม่มีให้เลือก */
  onCreateCollection?: () => void;
  /** folder เริ่มต้น (เช่น folder ที่เลือกอยู่ในหน้า collection) */
  defaultFolderId?: string | null;
}

/** อัปโหลดไฟล์ — synchronous: รอ chunk/embed เสร็จก่อน response กลับ */
export function UploadModal({
  open,
  onClose,
  onUploaded,
  collection,
  collections,
  onCreateCollection,
  defaultFolderId,
}: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [folderId, setFolderId] = useState<string>('root');
  const [category, setCategory] = useState<DocCategory | 'none'>('none');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setFile(null);
      setTitle('');
      setCollectionId('');
      setFolderId(defaultFolderId ?? 'root');
      setCategory('none');
      setUploading(false);
    }
  }, [open, defaultFolderId]);

  // หมวดหมู่ปลายทาง: หน้า collection ใช้ตัวที่เปิดอยู่, หน้าหลักต้องเลือกเอง
  const targetCollectionId = collection?.id ?? collectionId;
  const needsPicker = !collection;
  const noCollections = needsPicker && (collections?.length ?? 0) === 0;

  const pickFile = useCallback((f: File | undefined) => {
    if (!f) return;
    const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
    if (!ACCEPTED.includes(ext)) {
      toast.error(`รองรับเฉพาะไฟล์ ${ACCEPTED.join(' ')}`);
      return;
    }
    setFile(f);
    setTitle(prev => (prev.trim() ? prev : f.name.replace(/\.[^.]+$/, '')));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file || !targetCollectionId) return;
    setUploading(true);
    try {
      const doc = await uploadDocument({
        file,
        title: title.trim() || undefined,
        collectionId: targetCollectionId,
        folderId: collection && folderId !== 'root' ? folderId : undefined,
        category: collection && category !== 'none' ? category : undefined,
      });
      toast.success(`อัปโหลด "${doc.title}" สำเร็จ`);
      onUploaded(doc, targetCollectionId);
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setUploading(false);
    }
  }, [file, targetCollectionId, title, folderId, category, collection, onUploaded, onClose]);

  const fileExt = file ? (file.name.split('.').pop()?.toUpperCase() ?? null) : null;

  return (
    <ModalShell
      open={open}
      title="อัปโหลดเอกสาร"
      description={
        collection
          ? 'ไฟล์จะถูกเพิ่มเข้า collection นี้ทันที'
          : 'เอกสารทุกชิ้นต้องอยู่ใน collection — เลือกกล่องปลายทางก่อน'
      }
      icon={CloudUpload}
      locked={uploading}
      onClose={onClose}
    >
      {noCollections ? (
        <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <FolderOpen size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">ยังไม่มี collection ให้เก็บเอกสาร</p>
            <p className="mx-auto mt-1 max-w-72 text-xs leading-relaxed text-muted-foreground">
              สร้าง collection (หมวดหมู่) ก่อน แล้วค่อยอัปโหลดเอกสารเข้าไปในกล่องนั้น
            </p>
          </div>
          <Button variant="create" onClick={onCreateCollection}>
            <FolderPlus />
            สร้าง collection ก่อน
          </Button>
        </div>
      ) : (
      <div className="flex flex-col gap-4 px-6 pb-5">
        {/* หมวดหมู่ปลายทาง — บังคับเลือกเมื่ออัปโหลดจากหน้าหลัก */}
        {needsPicker && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              เก็บเข้า collection <span className="text-rose-500">*</span>
            </label>
            <Select value={collectionId} onValueChange={setCollectionId} disabled={uploading}>
              <SelectTrigger size="sm" aria-invalid={!collectionId}>
                <SelectValue placeholder="— เลือก collection —" />
              </SelectTrigger>
              <SelectContent>
                {collections?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Dropzone / ไฟล์ที่เลือก */}
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 transition-colors',
              dragging
                ? 'border-indigo-500/60 bg-indigo-500/5 text-foreground'
                : 'border-border text-muted-foreground hover:border-indigo-500/40 hover:text-foreground',
            )}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
              <CloudUpload className="size-5" />
            </div>
            <span className="text-[13px] font-semibold">ลากไฟล์มาวาง หรือกดเพื่อเลือก</span>
            <span className="font-mono text-[10px] tracking-wide">{ACCEPTED.join('  ')}</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
            <DocIcon sourceType="UPLOAD" fileType={fileExt} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setFile(null)}
              aria-label="เอาไฟล์ออก"
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={e => {
            pickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {/* ชื่อที่แสดง */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="upload-title" className="text-xs font-medium text-muted-foreground">
            ชื่อที่แสดง <span className="font-normal">(ไม่ใส่ = ใช้ชื่อไฟล์)</span>
          </label>
          <Input
            id="upload-title"
            value={title}
            disabled={uploading}
            onChange={e => setTitle(e.target.value)}
            placeholder="เช่น TOR ฉบับอนุมัติ"
          />
        </div>

        {/* ตำแหน่งใน collection */}
        {collection && collection.folders.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">วางในโฟลเดอร์</label>
            <Select value={folderId} onValueChange={setFolderId} disabled={uploading}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">— Root ของ collection —</SelectItem>
                {collection.folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {collection?.type === 'PROJECT' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">หมวดเอกสาร</label>
            <Select
              value={category}
              onValueChange={v => setCategory(v as DocCategory | 'none')}
              disabled={uploading}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— ไม่ระบุ —</SelectItem>
                {(Object.keys(CATEGORY_LABELS) as DocCategory[]).map(c => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {uploading && (
          <p className="flex items-center gap-2 rounded-lg bg-indigo-500/5 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400">
            <Loader2 className="size-3.5 animate-spin" />
            กำลังประมวลผลไฟล์ (chunk + embed) — ไฟล์ใหญ่อาจใช้เวลาหลายวินาที
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="cancel" disabled={uploading} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            variant="save"
            disabled={!file || !targetCollectionId || uploading}
            onClick={handleSubmit}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <CloudUpload />}
            {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลด'}
          </Button>
        </div>
      </div>
      )}
    </ModalShell>
  );
}
