'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderPlus, Loader2, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createCollection, updateCollection } from '@/lib/api/documents';
import type { CollectionSummary } from '../types';
import { ModalShell } from './modal-shell';

interface CollectionModalProps {
  open: boolean;
  /** null = สร้างใหม่ */
  editTarget?: { id: string; name: string; description: string | null } | null;
  onClose: () => void;
  onSaved: (collection: CollectionSummary) => void;
}

/** สร้าง / แก้ไข collection ส่วนตัว (PROJECT collection แก้ที่ตัว project) */
export function CollectionModal({ open, editTarget, onClose, onSaved }: CollectionModalProps) {
  const isEdit = !!editTarget;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editTarget?.name ?? '');
      setDescription(editTarget?.description ?? '');
      setSaving(false);
    }
  }, [open, editTarget]);

  const canSubmit = name.trim().length > 0 && name.trim().length <= 100 && description.length <= 500;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const input = { name: name.trim(), description: description.trim() || undefined };
      const saved = isEdit
        ? await updateCollection(editTarget.id, input)
        : await createCollection(input);
      toast.success(isEdit ? 'แก้ไข collection สำเร็จ' : `สร้าง "${saved.name}" สำเร็จ`);
      onSaved(saved);
      onClose();
    } catch (e) {
      const err = e as Error & { status?: number };
      toast.error(
        err.status === 409
          ? `มี collection ชื่อ "${name.trim()}" อยู่แล้ว`
          : err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่',
      );
    } finally {
      setSaving(false);
    }
  }, [canSubmit, name, description, isEdit, editTarget, onSaved, onClose]);

  return (
    <ModalShell
      open={open}
      title={isEdit ? 'แก้ไข collection' : 'สร้าง collection'}
      description={isEdit ? undefined : 'กล่องรวมเอกสาร — แชร์ให้เพื่อนร่วมทีมได้'}
      icon={isEdit ? Pencil : FolderPlus}
      locked={saving}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-6 pb-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="col-name" className="text-xs font-medium text-muted-foreground">
            ชื่อ collection
          </label>
          <Input
            id="col-name"
            value={name}
            disabled={saving}
            maxLength={100}
            onChange={e => setName(e.target.value)}
            placeholder="เช่น งานปี 2026"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="col-desc" className="text-xs font-medium text-muted-foreground">
            คำอธิบาย <span className="font-normal">(ไม่บังคับ)</span>
          </label>
          <Textarea
            id="col-desc"
            value={description}
            disabled={saving}
            maxLength={500}
            rows={3}
            onChange={e => setDescription(e.target.value)}
            placeholder="เก็บอะไรไว้ในกล่องนี้…"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="cancel" disabled={saving} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="save" disabled={!canSubmit || saving} onClick={handleSubmit}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? 'กำลังบันทึก…' : isEdit ? 'บันทึก' : 'สร้าง collection'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
