'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderPlus, Loader2, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFolder, updateFolder } from '@/lib/api/documents';
import type { Folder } from '../types';
import { ModalShell } from './modal-shell';

interface FolderModalProps {
  open: boolean;
  collectionId: string;
  /** โฟลเดอร์แม่ตอนสร้างใหม่ (null = root) */
  parentId?: string | null;
  parentName?: string;
  /** ใส่เมื่อเปลี่ยนชื่อ */
  editTarget?: Folder | null;
  onClose: () => void;
  onSaved: (folder: Folder, mode: 'create' | 'rename') => void;
}

/** สร้าง / เปลี่ยนชื่อโฟลเดอร์ใน collection (ซ้อนได้สูงสุด 10 ชั้น) */
export function FolderModal({
  open,
  collectionId,
  parentId,
  parentName,
  editTarget,
  onClose,
  onSaved,
}: FolderModalProps) {
  const isEdit = !!editTarget;
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editTarget?.name ?? '');
      setSaving(false);
    }
  }, [open, editTarget]);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      if (isEdit) {
        const folder = await updateFolder(collectionId, editTarget.id, { name: name.trim() });
        toast.success('เปลี่ยนชื่อโฟลเดอร์สำเร็จ');
        onSaved(folder, 'rename');
      } else {
        const folder = await createFolder(collectionId, {
          name: name.trim(),
          parentId: parentId ?? undefined,
        });
        toast.success(`สร้างโฟลเดอร์ "${folder.name}" สำเร็จ`);
        onSaved(folder, 'create');
      }
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'บันทึกโฟลเดอร์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [canSubmit, isEdit, editTarget, collectionId, name, parentId, onSaved, onClose]);

  return (
    <ModalShell
      open={open}
      title={isEdit ? 'เปลี่ยนชื่อโฟลเดอร์' : 'สร้างโฟลเดอร์'}
      description={
        isEdit ? undefined : parentName ? `สร้างข้างใน "${parentName}"` : 'สร้างที่ root ของ collection'
      }
      icon={isEdit ? Pencil : FolderPlus}
      locked={saving}
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-4 px-6 pb-5"
        onSubmit={e => { e.preventDefault(); handleSubmit(); }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="folder-name" className="text-xs font-medium text-muted-foreground">
            ชื่อโฟลเดอร์
          </label>
          <Input
            id="folder-name"
            value={name}
            disabled={saving}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น Specs"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="cancel" type="button" disabled={saving} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="save" type="submit" disabled={!canSubmit || saving}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? 'กำลังบันทึก…' : isEdit ? 'บันทึก' : 'สร้างโฟลเดอร์'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
