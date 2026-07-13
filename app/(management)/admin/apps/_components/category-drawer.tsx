'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FolderTree, Plus, Pencil, Trash2, Check, X, GripVertical } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { AppIcon } from '@/components/app-icon';
import { ActiveToggle } from './active-toggle';
import { IconPicker } from './icon-picker';
import { cn } from '@/lib/utils';
import type { AdminCategory, CreateCategoryInput, UpdateCategoryInput } from '@/lib/apphub/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CategoryDrawerProps {
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

// ── Sortable row ───────────────────────────────────────────────────────────────

interface SortableRowProps {
  cat: AdminCategory;
  editId: string | null;
  editName: string;
  editIcon: string | null;
  canUpdate: boolean;
  canDelete: boolean;
  busy: boolean;
  onStartEdit: (cat: AdminCategory) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (cat: AdminCategory) => void;
  onEditName: (v: string) => void;
  onEditIcon: (v: string | null) => void;
  onToggle: (cat: AdminCategory) => void;
  onDelete: (cat: AdminCategory) => void;
}

function SortableRow({
  cat,
  editId,
  editName,
  editIcon,
  canUpdate,
  canDelete,
  busy,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onEditName,
  onEditIcon,
  onToggle,
  onDelete,
}: SortableRowProps) {
  const editing = editId === cat.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id, disabled: editing || busy });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-background px-3 py-2 transition-colors',
        !cat.isActive && !editing
          ? 'border-dashed border-border/50 opacity-50'
          : 'border-border',
        isDragging && 'shadow-lg',
      )}
    >
      {editing ? (
        /* ── Edit mode ── */
        <>
          <IconPicker value={editIcon} onChange={onEditIcon} size="sm" />
          <input
            type="text"
            value={editName}
            autoFocus
            onChange={e => onEditName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSubmitEdit(cat);
              if (e.key === 'Escape') onCancelEdit();
            }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={() => onSubmitEdit(cat)}
            disabled={!editName.trim() || busy}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        /* ── Normal mode ── */
        <>
          {/* Drag handle — only shown when canUpdate */}
          {canUpdate && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
              title="ลากเพื่อเรียงลำดับ"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
            <AppIcon name={cat.icon} className="h-4 w-4" />
          </div>

          {/* Name + count */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-foreground">{cat.name}</div>
            <div className="text-[10px] text-muted-foreground">{cat._count.apps} แอป</div>
          </div>

          {/* Toggle */}
          {canUpdate && (
            <ActiveToggle
              active={cat.isActive}
              disabled={busy}
              onToggle={() => onToggle(cat)}
            />
          )}

          {/* Edit */}
          {canUpdate && (
            <button
              type="button"
              onClick={() => onStartEdit(cat)}
              title="แก้ไข"
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Delete */}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(cat)}
              title="ลบ"
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
    </li>
  );
}

// ── Main drawer ────────────────────────────────────────────────────────────────

export function CategoryDrawer({
  open,
  categories,
  canCreate,
  canUpdate,
  canDelete,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryDrawerProps) {
  // Local ordered copy for drag-reorder
  const [localItems, setLocalItems] = useState<AdminCategory[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // New category form
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<string | null>(null);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  // Sync local items when drawer opens or category count changes
  useEffect(() => {
    setLocalItems([...categories].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [open, categories.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset add-form when drawer closes
  useEffect(() => {
    if (!open) {
      setNewName('');
      setNewIcon(null);
      setEditId(null);
    }
  }, [open]);

  // ── DnD ─────────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex(c => c.id === active.id);
    const newIndex = localItems.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(newOrder);

    // Persist sortOrder for items that moved
    const updates = newOrder.flatMap((cat, i) => {
      if (localItems.findIndex(c => c.id === cat.id) !== i) {
        return [onUpdate(cat.id, { sortOrder: i * 10 })];
      }
      return [];
    });

    await Promise.all(updates).catch(() => {/* toast shown by parent */});
  }

  const activeCat = activeDragId ? localItems.find(c => c.id === activeDragId) : null;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const submitNew = useCallback(async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate({ name: newName.trim(), icon: newIcon });
      setNewName('');
      setNewIcon(null);
    } finally {
      setBusy(false);
    }
  }, [newName, newIcon, busy, onCreate]);

  function startEdit(cat: AdminCategory) {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
  }

  const submitEdit = useCallback(async (cat: AdminCategory) => {
    if (!editName.trim() || busy) return;
    setBusy(true);
    // Optimistic update in drawer
    setLocalItems(prev =>
      prev.map(c => c.id === cat.id ? { ...c, name: editName.trim(), icon: editIcon } : c),
    );
    setEditId(null);
    try {
      await onUpdate(cat.id, { name: editName.trim(), icon: editIcon });
    } finally {
      setBusy(false);
    }
  }, [editName, editIcon, busy, onUpdate]);

  const handleToggle = useCallback(async (cat: AdminCategory) => {
    const next = !cat.isActive;
    setLocalItems(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: next } : c));
    try {
      await onUpdate(cat.id, { isActive: next });
    } catch {
      setLocalItems(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: cat.isActive } : c));
    }
  }, [onUpdate]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 sm:max-w-[420px]"
        style={{ maxWidth: 420 }}
      >
        {/* Brand gradient stripe */}
        <div className="h-1 w-full shrink-0 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
              <FolderTree className="h-4 w-4 text-white" />
            </div>
            <div>
              <SheetTitle className="text-[14px] font-bold">จัดการหมวดหมู่</SheetTitle>
              <SheetDescription className="mt-0 text-[11px]">
                {localItems.length} หมวดหมู่
              </SheetDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        {/* Add new category */}
        {canCreate && (
          <div className="shrink-0 border-b border-border/60 bg-muted/20 px-5 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              เพิ่มหมวดหมู่ใหม่
            </p>
            <div className="flex items-center gap-2">
              <IconPicker value={newIcon} onChange={setNewIcon} />
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitNew(); }}
                placeholder="ชื่อหมวดหมู่"
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
              <button
                type="button"
                onClick={submitNew}
                disabled={!newName.trim() || busy}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-linear-to-r from-indigo-500 to-violet-600 px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                เพิ่ม
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {localItems.length === 0 && (
            <p className="py-10 text-center text-[13px] text-muted-foreground">ยังไม่มีหมวดหมู่</p>
          )}

          {localItems.length > 0 && (
            <>
              {canUpdate && (
                <p className="mb-2 text-[10px] text-muted-foreground/60">
                  ลากเพื่อเรียงลำดับ
                </p>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localItems.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-1.5">
                    {localItems.map(cat => (
                      <SortableRow
                        key={cat.id}
                        cat={cat}
                        editId={editId}
                        editName={editName}
                        editIcon={editIcon}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        busy={busy}
                        onStartEdit={startEdit}
                        onCancelEdit={() => setEditId(null)}
                        onSubmitEdit={submitEdit}
                        onEditName={setEditName}
                        onEditIcon={setEditIcon}
                        onToggle={handleToggle}
                        onDelete={onDelete}
                      />
                    ))}
                  </ul>
                </SortableContext>

                {/* Drag overlay — ghost card while dragging */}
                <DragOverlay>
                  {activeCat && (
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
                        <AppIcon name={activeCat.icon} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-foreground">{activeCat.name}</div>
                        <div className="text-[10px] text-muted-foreground">{activeCat._count.apps} แอป</div>
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
