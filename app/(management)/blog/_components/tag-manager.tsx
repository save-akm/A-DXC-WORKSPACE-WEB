'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Tags, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { createTag, updateTag, deleteTag } from '@/lib/api/blog';
import { type Tag, humanizeBlogError } from '@/lib/blog/types';
import { tagChipStyle } from './blog-meta';

const PRESET_COLORS = [
  '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e',
  '#6366f1', '#14b8a6', '#ec4899', '#f97316', '#64748b',
];

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';

/** Keep Tab cycling inside the dialog while it is open. */
function trapTab(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'Tab') return;
  const focusables = e.currentTarget.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

interface TagManagerProps {
  open: boolean;
  tags: Tag[];
  canDelete: boolean;
  onClose: () => void;
  /** Called with the updated tag list after any successful mutation. */
  onChange: (tags: Tag[]) => void;
}

export function TagManager({ open, tags, canDelete, onClose, onChange }: TagManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setColor(PRESET_COLORS[0]);
    setDescription('');
  }

  useEffect(() => {
    if (!open) return;
    resetForm();
    // Move focus into the dialog once it has mounted.
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  // Escape closes the dialog (unless a save is in flight).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, saving, onClose]);

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color || PRESET_COLORS[0]);
    setDescription(tag.description ?? '');
    nameRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateTag(editingId, { name: trimmed, color, description: description.trim() || null });
        onChange(tags.map((t) => (t.id === editingId ? { ...t, ...updated } : t)));
        toast.success('บันทึกแท็กแล้ว');
      } else {
        const created = await createTag({ name: trimmed, color, description: description.trim() || null });
        onChange([...tags, created].sort((a, b) => a.name.localeCompare(b.name, 'th')));
        toast.success('เพิ่มแท็กแล้ว');
      }
      resetForm();
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tag: Tag) {
    setDeletingId(tag.id);
    try {
      await deleteTag(tag.id);
      onChange(tags.filter((t) => t.id !== tag.id));
      if (editingId === tag.id) resetForm();
      toast.success('ลบแท็กแล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="tag-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !saving && onClose()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="tag-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tag-manager-title"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={trapTab}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/25">
                    <Tags className="size-4" />
                  </div>
                  <div>
                    <h2 id="tag-manager-title" className="text-[14px] font-bold text-foreground">จัดการแท็ก</h2>
                    <p className="text-[11px] text-muted-foreground">หมวดหมู่สำหรับจัดกลุ่มบทความ</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="ปิด"
                  onClick={() => !saving && onClose()}
                  className={cn('flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', FOCUS_RING)}
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 border-b border-border/60 px-6 py-4">
                <div className="flex gap-2">
                  <Input
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อแท็ก เช่น Backend"
                  />
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="คำอธิบาย (ไม่บังคับ)"
                    className="hidden sm:block"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-0.5">
                    {/* 32px hit area around the 24px swatch */}
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        aria-label={`เลือกสี ${c}`}
                        aria-pressed={color === c}
                        className={cn('group flex size-8 cursor-pointer items-center justify-center rounded-full', FOCUS_RING)}
                      >
                        <span
                          style={{ backgroundColor: c }}
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-transform group-hover:scale-110',
                            color === c ? 'ring-2 ring-foreground/40' : '',
                          )}
                        >
                          {color === c && <Check className="size-3 text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {editingId && (
                      <Button variant="cancel" size="sm" type="button" onClick={resetForm}>
                        ยกเลิก
                      </Button>
                    )}
                    <Button variant="create" size="sm" type="submit" disabled={saving || !name.trim()}>
                      {editingId ? <Check /> : <Plus />}
                      {editingId ? 'บันทึก' : 'เพิ่มแท็ก'}
                    </Button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                {tags.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีแท็ก</p>
                ) : (
                  <ul className="space-y-0.5">
                    {tags.map((tag) => (
                      <li
                        key={tag.id}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-2.5 py-1 transition-colors hover:bg-muted/50',
                          editingId === tag.id && 'bg-muted/60',
                        )}
                      >
                        <span
                          style={tagChipStyle(tag.color)}
                          className="tag-chip inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                        >
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: tag.color || '#7c3aed' }} />
                          {tag.name}
                        </span>
                        <div className="min-w-0 flex-1">
                          {tag.description && (
                            <p className="truncate text-xs text-muted-foreground">{tag.description}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
                          {tag._count?.posts ?? 0} บทความ
                        </span>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => startEdit(tag)}
                            className={cn('flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground', FOCUS_RING)}
                            title="แก้ไข"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              disabled={deletingId === tag.id}
                              onClick={() => handleDelete(tag)}
                              className={cn('flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50', FOCUS_RING)}
                              title="ลบ"
                            >
                              {deletingId === tag.id ? (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
