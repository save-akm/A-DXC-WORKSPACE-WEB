'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, FilePlus2, Loader2, Search } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fetchMyDocuments, addDocumentsToCollection } from '@/lib/api/documents';
import type { MyDocument } from '../types';
import { ModalShell } from './modal-shell';
import { DocIcon, DocTypeLabel, formatDate } from './doc-meta';

interface AddDocsModalProps {
  open: boolean;
  collectionId: string;
  /** id เอกสารที่อยู่ใน collection แล้ว — ไม่ต้องแสดงซ้ำ */
  existingDocIds: Set<string>;
  /** โฟลเดอร์ปลายทาง (null = root) — ตามที่เลือกอยู่ในหน้า collection */
  targetFolderId: string | null;
  targetFolderName?: string;
  onClose: () => void;
  onAdded: () => void;
}

/** เลือกเอกสารที่มีอยู่แล้ว (ของตัวเอง) เพิ่มเข้า collection */
export function AddDocsModal({
  open,
  collectionId,
  existingDocIds,
  targetFolderId,
  targetFolderName,
  onClose,
  onAdded,
}: AddDocsModalProps) {
  const [docs, setDocs] = useState<MyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch('');
    setLoading(true);
    fetchMyDocuments()
      .then(setDocs)
      .catch(() => toast.error('โหลดรายการเอกสารไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [open]);

  const candidates = useMemo(() => {
    let result = docs.filter(d => !existingDocIds.has(d.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q));
    }
    return result;
  }, [docs, existingDocIds, search]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const result = await addDocumentsToCollection(collectionId, {
        documents: Array.from(selected).map(documentId => ({
          documentId,
          folderId: targetFolderId ?? undefined,
        })),
      });
      if (result.added > 0) toast.success(`เพิ่ม ${result.added} เอกสารเข้า collection แล้ว`);
      if (result.rejected.length > 0) {
        toast.error(`${result.rejected.length} รายการเพิ่มไม่ได้ (ไม่ใช่เอกสารของคุณ)`);
      }
      onAdded();
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'เพิ่มเอกสารไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [selected, collectionId, targetFolderId, onAdded, onClose]);

  return (
    <ModalShell
      open={open}
      title="เพิ่มเอกสารที่มีอยู่"
      description={
        targetFolderId
          ? `เอกสารจะถูกวางในโฟลเดอร์ "${targetFolderName ?? ''}"`
          : 'เอกสารจะถูกวางที่ root ของ collection'
      }
      icon={FilePlus2}
      maxWidth="max-w-lg"
      locked={saving}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 px-6 pb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder="ค้นหาเอกสารของฉัน…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex max-h-72 min-h-32 flex-col gap-1 overflow-y-auto rounded-xl border border-border/60 p-1.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-muted/60" />
            ))
          ) : candidates.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              {search ? 'ไม่พบเอกสารที่ตรงกับคำค้น' : 'เอกสารของคุณอยู่ใน collection นี้ครบแล้ว'}
            </p>
          ) : (
            candidates.map(doc => {
              const isSelected = selected.has(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  disabled={saving}
                  onClick={() => toggle(doc.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
                    isSelected ? 'bg-indigo-500/10' : 'hover:bg-muted/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-border bg-background',
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                  <DocIcon sourceType={doc.sourceType} fileType={doc.fileType} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{doc.title}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </span>
                  <DocTypeLabel sourceType={doc.sourceType} fileType={doc.fileType} />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4">
          <span className="text-xs text-muted-foreground">
            เลือกแล้ว {selected.size} รายการ
          </span>
          <div className="flex gap-2">
            <Button variant="cancel" disabled={saving} onClick={onClose}>
              ยกเลิก
            </Button>
            <Button variant="save" disabled={selected.size === 0 || saving} onClick={handleSubmit}>
              {saving ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
              {saving ? 'กำลังเพิ่ม…' : `เพิ่ม ${selected.size || ''} เอกสาร`}
            </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
