'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderOpen, FolderPlus, Link2, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { createLinkDocument } from '@/lib/api/documents';
import type { CollectionSummary, CollectionType, DocCategory, Folder, MyDocument } from '../types';
import { ModalShell } from './modal-shell';
import { CATEGORY_LABELS } from './doc-meta';

interface LinkModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (doc: MyDocument, collectionId: string) => void;
  /** เมื่อแปะลิงก์เข้า collection โดยตรง (หน้า collection detail) */
  collection?: { id: string; type: CollectionType; folders: Folder[] };
  /** ตัวเลือก collection สำหรับหน้าหลัก — เอกสารทุกชิ้นต้องอยู่ใน collection */
  collections?: CollectionSummary[];
  /** เปิด flow สร้าง collection เมื่อยังไม่มีให้เลือก */
  onCreateCollection?: () => void;
  defaultFolderId?: string | null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** แปะลิงก์ภายนอก (SharePoint ฯลฯ) — เก็บอ้างอิงได้ แต่ AI ไม่ค้นเนื้อหาข้างใน */
export function LinkModal({
  open,
  onClose,
  onCreated,
  collection,
  collections,
  onCreateCollection,
  defaultFolderId,
}: LinkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [folderId, setFolderId] = useState<string>('root');
  const [category, setCategory] = useState<DocCategory | 'none'>('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setUrl('');
      setCollectionId('');
      setFolderId(defaultFolderId ?? 'root');
      setCategory('none');
      setSaving(false);
    }
  }, [open, defaultFolderId]);

  // หมวดหมู่ปลายทาง: หน้า collection ใช้ตัวที่เปิดอยู่, หน้าหลักต้องเลือกเอง
  const targetCollectionId = collection?.id ?? collectionId;
  const needsPicker = !collection;
  const noCollections = needsPicker && (collections?.length ?? 0) === 0;

  const urlInvalid = url.trim() !== '' && !isValidHttpUrl(url.trim());
  const canSubmit =
    title.trim().length > 0 &&
    title.trim().length <= 255 &&
    isValidHttpUrl(url.trim()) &&
    !!targetCollectionId;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const doc = await createLinkDocument({
        title: title.trim(),
        url: url.trim(),
        collectionId: targetCollectionId,
        folderId: collection && folderId !== 'root' ? folderId : undefined,
        category: collection && category !== 'none' ? category : undefined,
      });
      toast.success(`เพิ่มลิงก์ "${doc.title}" สำเร็จ`);
      onCreated(doc, targetCollectionId);
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'เพิ่มลิงก์ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }, [canSubmit, title, url, targetCollectionId, folderId, category, collection, onCreated, onClose]);

  return (
    <ModalShell
      open={open}
      title="แปะลิงก์ภายนอก"
      description="SharePoint, Google Docs ฯลฯ — AI จะไม่ค้นเนื้อหาข้างในลิงก์"
      icon={Link2}
      accent="from-violet-500 to-fuchsia-500"
      locked={saving}
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
              สร้าง collection (หมวดหมู่) ก่อน แล้วค่อยแปะลิงก์เข้าไปในกล่องนั้น
            </p>
          </div>
          <Button variant="create" onClick={onCreateCollection}>
            <FolderPlus />
            สร้าง collection ก่อน
          </Button>
        </div>
      ) : (
      <div className="flex flex-col gap-4 px-6 pb-5">
        {/* หมวดหมู่ปลายทาง — บังคับเลือกเมื่อแปะลิงก์จากหน้าหลัก */}
        {needsPicker && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              เก็บเข้า collection <span className="text-rose-500">*</span>
            </label>
            <Select value={collectionId} onValueChange={setCollectionId} disabled={saving}>
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="link-title" className="text-xs font-medium text-muted-foreground">
            ชื่อที่แสดง
          </label>
          <Input
            id="link-title"
            value={title}
            disabled={saving}
            maxLength={255}
            onChange={e => setTitle(e.target.value)}
            placeholder="เช่น TOR ฉบับอนุมัติ"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="link-url" className="text-xs font-medium text-muted-foreground">
            URL
          </label>
          <Input
            id="link-url"
            value={url}
            disabled={saving}
            aria-invalid={urlInvalid}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://hlas.sharepoint.com/sites/…"
            className="font-mono text-xs"
          />
          {urlInvalid && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              ต้องเป็นลิงก์ http:// หรือ https:// เท่านั้น
            </p>
          )}
        </div>

        {collection && collection.folders.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">วางในโฟลเดอร์</label>
            <Select value={folderId} onValueChange={setFolderId} disabled={saving}>
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
              disabled={saving}
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

        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="cancel" disabled={saving} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="save" disabled={!canSubmit || saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="animate-spin" /> : <Link2 />}
            {saving ? 'กำลังบันทึก…' : 'เพิ่มลิงก์'}
          </Button>
        </div>
      </div>
      )}
    </ModalShell>
  );
}
