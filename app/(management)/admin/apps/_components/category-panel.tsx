'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, FolderTree, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import type { AdminCategory, CreateCategoryInput, UpdateCategoryInput } from '@/lib/apphub/types';

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-2.5 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';

interface CategoryPanelProps {
  open: boolean;
  categories: AdminCategory[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onCreate: (input: CreateCategoryInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateCategoryInput) => Promise<void>;
  onDelete: (cat: AdminCategory) => void;
}

export function CategoryPanel({
  open, categories, canCreate, canUpdate, canDelete, onClose, onCreate, onUpdate, onDelete,
}: CategoryPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // New-category draft
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');

  // Edit draft
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!open) { setEditId(null); setNewName(''); setNewIcon(''); } }, [open]);

  function startEdit(cat: AdminCategory) {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon ?? '');
  }

  async function submitNew() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate({ name: newName.trim(), icon: newIcon.trim() || null });
      setNewName('');
      setNewIcon('');
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit(cat: AdminCategory) {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      await onUpdate(cat.id, { name: editName.trim(), icon: editIcon.trim() || null });
      setEditId(null);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(cat: AdminCategory) {
    setBusy(true);
    try {
      await onUpdate(cat.id, { isActive: !cat.isActive });
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cat-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="cat-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                    <FolderTree className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">จัดการหมวดหมู่</h2>
                    <p className="text-[11px] text-muted-foreground">{categories.length} หมวดหมู่</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Add row */}
              {canCreate && (
                <div className="flex items-end gap-2 border-b border-border/60 bg-muted/30 px-6 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                    <AppIcon name={newIcon} className="h-4 w-4 text-foreground" />
                  </div>
                  <input
                    type="text" value={newIcon} onChange={e => setNewIcon(e.target.value)}
                    placeholder="ไอคอน" className={cn(INPUT_CLASS, 'w-24 shrink-0')}
                  />
                  <input
                    type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitNew(); }}
                    placeholder="ชื่อหมวดหมู่ใหม่" className={INPUT_CLASS}
                  />
                  <button
                    type="button" onClick={submitNew} disabled={!newName.trim() || busy}
                    className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-linear-to-r from-indigo-500 to-violet-600 px-3 text-[12px] font-semibold text-white shadow-sm transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> เพิ่ม
                  </button>
                </div>
              )}

              {/* List */}
              <div className="flex-1 overflow-y-auto px-6 py-3">
                {categories.length === 0 && (
                  <p className="py-10 text-center text-[13px] text-muted-foreground">ยังไม่มีหมวดหมู่</p>
                )}
                <ul className="space-y-1.5">
                  {categories.map(cat => {
                    const editing = editId === cat.id;
                    return (
                      <li
                        key={cat.id}
                        className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
                      >
                        {editing ? (
                          <>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                              <AppIcon name={editIcon} className="h-4 w-4 text-foreground" />
                            </div>
                            <input type="text" value={editIcon} onChange={e => setEditIcon(e.target.value)} placeholder="ไอคอน" className={cn(INPUT_CLASS, 'w-20 shrink-0')} />
                            <input
                              type="text" value={editName} onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') submitEdit(cat); }}
                              className={INPUT_CLASS} autoFocus
                            />
                            <button type="button" onClick={() => submitEdit(cat)} disabled={busy} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60">
                              <Check className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setEditId(null)} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                              <AppIcon name={cat.icon} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-semibold text-foreground">{cat.name}</div>
                              <div className="text-[10px] text-muted-foreground">{cat._count.apps} แอป</div>
                            </div>
                            {canUpdate && (
                              <ActiveToggle
                                active={cat.isActive}
                                disabled={busy}
                                showLabel={false}
                                onToggle={() => toggleActive(cat)}
                              />
                            )}
                            {canUpdate && (
                              <button type="button" onClick={() => startEdit(cat)} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button type="button" onClick={() => onDelete(cat)} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
