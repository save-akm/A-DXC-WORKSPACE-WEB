'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { createActivityTag, deleteActivityTag, fetchActivityTags } from '@/lib/api/activity';
import { humanizeActivityError } from './activity-meta';
import type { ActivityTag } from '@/lib/activity/types';
import { ConfirmDialog } from '@/components/management/confirm-dialog';

interface TagPanelProps {
  tags: ActivityTag[];
  onChange: (tags: ActivityTag[]) => void;
  canManage: boolean;
}

export function TagPanel({ tags, onChange, canManage }: TagPanelProps) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivityTag | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshTags() {
    const list = await fetchActivityTags();
    onChange(list.sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createActivityTag({ name });
      await refreshTags();
      setNewName('');
      toast.success('สร้างแท็กสำเร็จ');
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteActivityTag(deleteTarget.id);
      await refreshTags();
      toast.success('ลบแท็กสำเร็จ');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/60 bg-card/40 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-bold">แท็กกิจกรรม</h3>
          <span className="text-xs text-muted-foreground">({tags.length})</span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.length === 0 && (
            <span className="text-xs text-muted-foreground">ยังไม่มีแท็ก</span>
          )}
          {tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium"
            >
              {t.name}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(t)}
                  className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`ลบแท็ก ${t.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ชื่อแท็กใหม่…"
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={creating || !newName.trim()}
              onClick={handleCreate}
              className="shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่ม
            </Button>
          </div>
        )}
      </motion.div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบแท็ก"
        loading={deleting}
        message={
          <>
            ลบแท็ก <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
            ไม่สามารถลบได้หากยังผูกกับกิจกรรม
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
