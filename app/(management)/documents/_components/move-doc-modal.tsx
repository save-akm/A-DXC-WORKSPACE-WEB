'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderInput, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { updateDocumentInCollection } from '@/lib/api/documents';
import type { CollectionType, DocCategory, DocumentInCollection, Folder } from '../types';
import { ModalShell } from './modal-shell';
import { CATEGORY_LABELS } from './doc-meta';

interface MoveDocModalProps {
  open: boolean;
  collectionId: string;
  collectionType: CollectionType;
  folders: Folder[];
  target: DocumentInCollection | null;
  onClose: () => void;
  onMoved: (docId: string, folderId: string | null, category: DocCategory | null) => void;
}

/** เรียงโฟลเดอร์แบบ tree (ลูกเยื้องตามชั้น) สำหรับ dropdown */
function flattenFolders(folders: Folder[]): Array<{ folder: Folder; depth: number }> {
  const byParent = new Map<string | null, Folder[]>();
  for (const f of folders) {
    const key = f.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), f]);
  }
  const result: Array<{ folder: Folder; depth: number }> = [];
  const walk = (parentId: string | null, depth: number) => {
    const children = (byParent.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name, 'th'));
    for (const f of children) {
      result.push({ folder: f, depth });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

/** ย้ายเอกสารไปโฟลเดอร์อื่น / เปลี่ยนหมวด (PROJECT) — ภายใน collection เดียวกัน */
export function MoveDocModal({
  open,
  collectionId,
  collectionType,
  folders,
  target,
  onClose,
  onMoved,
}: MoveDocModalProps) {
  const [folderId, setFolderId] = useState<string>('root');
  const [category, setCategory] = useState<DocCategory | 'none'>('none');
  const [saving, setSaving] = useState(false);

  const flat = useMemo(() => flattenFolders(folders), [folders]);
  const isProject = collectionType === 'PROJECT';

  useEffect(() => {
    if (open && target) {
      setFolderId(target.folderId ?? 'root');
      setCategory(target.category ?? 'none');
      setSaving(false);
    }
  }, [open, target]);

  const handleSubmit = useCallback(async () => {
    if (!target) return;
    const nextFolderId = folderId === 'root' ? null : folderId;
    const nextCategory = category === 'none' ? null : category;
    const folderChanged = nextFolderId !== target.folderId;
    const categoryChanged = isProject && nextCategory !== target.category;
    if (!folderChanged && !categoryChanged) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updateDocumentInCollection(collectionId, target.documentId, {
        ...(folderChanged ? { folderId: nextFolderId } : {}),
        // API ไม่รองรับล้าง category กลับเป็น null — ส่งเฉพาะตอนเลือกค่าใหม่
        ...(categoryChanged && nextCategory ? { category: nextCategory } : {}),
      });
      toast.success('ย้ายเอกสารสำเร็จ');
      onMoved(target.documentId, nextFolderId, nextCategory ?? target.category);
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'ย้ายเอกสารไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [target, folderId, category, isProject, collectionId, onMoved, onClose]);

  return (
    <ModalShell
      open={open}
      title="ย้ายเอกสาร"
      description={target?.document.title}
      icon={FolderInput}
      locked={saving}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-6 pb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">ไปที่โฟลเดอร์</label>
          <Select value={folderId} onValueChange={setFolderId} disabled={saving}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">— Root ของ collection —</SelectItem>
              {flat.map(({ folder, depth }) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {`${' '.repeat(depth * 3)}${folder.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isProject && (
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
          <Button variant="save" disabled={saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="animate-spin" /> : <FolderInput />}
            {saving ? 'กำลังย้าย…' : 'ย้ายเอกสาร'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
