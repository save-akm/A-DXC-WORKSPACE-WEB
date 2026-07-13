'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Star, Loader2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  uploadActivityImage,
  updateActivityImage,
  deleteActivityImage,
  fetchAdminActivity,
} from '@/lib/api/activity';
import type { ActivityDetail, ActivityImage } from '@/lib/activity/types';
import { humanizeActivityError } from './activity-meta';
import {
  partitionActivityImageFiles,
} from '@/lib/activity/image-validation';
import { ACTIVITY_IMAGE_ACCEPT } from '@/lib/activity/types';
import { ConfirmDialog } from '@/components/management/confirm-dialog';
import { ImageHoverPreview } from './image-hover-preview';

interface ActivityImageGalleryProps {
  activity: ActivityDetail;
  canManage: boolean;
  onUpdated: (activity: ActivityDetail) => void;
}

export function ActivityImageGallery({ activity, canManage, onUpdated }: ActivityImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Local ordered copy for optimistic drag-reorder. Re-sync during render (not in an
  // effect) whenever the server images change — the React-recommended pattern for
  // deriving state from props without an extra paint.
  const sortedFromProps = [...activity.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const imagesSignature = activity.images
    .map((i) => `${i.id}:${i.sortOrder}`)
    .join(',');

  const [localImages, setLocalImages] = useState<ActivityImage[]>(sortedFromProps);
  const [syncedSignature, setSyncedSignature] = useState(imagesSignature);
  if (syncedSignature !== imagesSignature) {
    setSyncedSignature(imagesSignature);
    setLocalImages(sortedFromProps);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function refresh() {
    const detail = await fetchAdminActivity(activity.id);
    onUpdated(detail);
  }

  async function handleUpload(incoming: FileList | null) {
    if (!incoming?.length || !canManage) return;

    const { valid, rejected } = partitionActivityImageFiles(Array.from(incoming));
    for (const { file, reason } of rejected) {
      toast.error(`${file.name}: ${reason}`);
    }
    if (valid.length === 0) return;

    setUploading(true);
    try {
      // Backend appends each image (next sortOrder); the first image is the cover.
      for (const file of valid) {
        await uploadActivityImage(activity.id, file, {
          caption: caption.trim() || undefined,
        });
      }
      setCaption('');
      await refresh();
      toast.success(`อัปโหลด ${valid.length} รูปสำเร็จ`);
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localImages.findIndex((i) => i.id === active.id);
    const newIndex = localImages.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = arrayMove(localImages, oldIndex, newIndex);
    setLocalImages(newOrder); // optimistic

    setSavingOrder(true);
    try {
      // Persist sortOrder only for images whose position actually changed. The
      // backend derives the cover from the first image (lowest sortOrder), so moving
      // an image to the front automatically makes it the front-page cover.
      const updates = newOrder.flatMap((img, i) =>
        localImages.findIndex((x) => x.id === img.id) !== i
          ? [updateActivityImage(activity.id, img.id, { sortOrder: i * 10 })]
          : [],
      );
      await Promise.all(updates);

      await refresh();
      toast.success('จัดลำดับรูปแล้ว');
    } catch (err) {
      toast.error(humanizeActivityError(err));
      await refresh(); // revert to server truth
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteActivityImage(activity.id, deleteTarget);
      await refresh();
      toast.success('ลบรูปสำเร็จ');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {canManage && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card/40 p-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACTIVITY_IMAGE_ACCEPT.join(',')}
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-4 transition-colors',
                'hover:border-violet-400/50 hover:bg-violet-500/5 disabled:opacity-60',
              )}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              ) : (
                <ImagePlus className="h-5 w-5 text-violet-500" />
              )}
              <span className="text-sm font-medium">
                {uploading ? 'กำลังอัปโหลด…' : 'เลือกรูปเพื่ออัปโหลด'}
              </span>
            </button>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="คำอธิบาย (ใช้กับรูปชุดถัดไป)"
              className="h-10 text-sm sm:max-w-[220px]"
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            JPG, PNG, WEBP · รูปแรกเมื่อยังไม่มีปกจะถูกตั้งเป็นปกอัตโนมัติ
          </p>
        </div>
      )}

      {localImages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรูปภาพ
        </p>
      ) : (
        <>
          {canManage && (
            <p className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5" />
              ลากเพื่อจัดลำดับ · รูปแรกคือรูปปกที่แสดงหน้าแรก
              {savingOrder && <Loader2 className="ml-1 h-3 w-3 animate-spin text-violet-500" />}
            </p>
          )}

          {canManage ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={localImages.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {localImages.map((img, i) => (
                    <SortableImage
                      key={img.id}
                      img={img}
                      isCover={i === 0}
                      disabled={savingOrder}
                      onDelete={() => setDeleteTarget(img.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {localImages.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-xl border border-border/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageUrl} alt={img.caption ?? ''} className="aspect-4/3 w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบรูปภาพ"
        loading={deleting}
        message="ลบรูปนี้ออกจากกิจกรรม? หากเป็นรูปปก ระบบจะเลือกรูปถัดไปให้อัตโนมัติ"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ── Sortable image tile ─────────────────────────────────────────────────────────

interface SortableImageProps {
  img: ActivityImage;
  isCover: boolean;
  disabled: boolean;
  onDelete: () => void;
}

function SortableImage({ img, isCover, disabled, onDelete }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl',
        isCover ? 'ring-2 ring-violet-500/20' : '',
        isDragging && 'opacity-60 shadow-xl',
      )}
    >
      <ImageHoverPreview
        src={img.imageUrl}
        alt={img.caption ?? ''}
        className={cn(
          'group overflow-hidden rounded-xl border',
          isCover ? 'border-violet-500/50' : 'border-border/60',
        )}
        imgClassName="aspect-4/3 w-full object-cover"
      >
        {isCover && (
          <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
            <Star className="h-2.5 w-2.5 fill-current" />
            รูปปก
          </span>
        )}

        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="ลากเพื่อจัดลำดับ"
          title="ลากเพื่อจัดลำดับ"
          className="absolute left-2 top-2 z-10 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-lg bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Delete */}
        <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-black/55 text-white transition-colors hover:bg-red-500/80"
            aria-label="ลบรูป"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </ImageHoverPreview>

      {img.caption && (
        <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">{img.caption}</p>
      )}
    </div>
  );
}
