'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchActivityTags } from '@/lib/api/activity';
import type { ActivityTag } from '@/lib/activity/types';

const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

interface ActivityTagPickerProps {
  /** Selected tag ids — sent as `tagIds` on POST/PATCH /admin/activities. */
  value: string[];
  onChange: (tagIds: string[]) => void;
  /** Re-fetch when this flips true (e.g. modal open). */
  active?: boolean;
  emptyHint?: string;
}

/**
 * Loads tags from GET /activity-tags and renders a multi-select chip list.
 * Used by the admin activity form; tag CRUD stays on POST/DELETE /admin/activity-tags.
 */
export function ActivityTagPicker({
  value,
  onChange,
  active = true,
  emptyHint = 'ยังไม่มีแท็ก — สร้างได้ที่แผง "แท็กกิจกรรม" ด้านบน',
}: ActivityTagPickerProps) {
  const [tags, setTags] = useState<ActivityTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    fetchActivityTags()
      .then((list) => setTags(list.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, [active]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((t) => t !== id) : [...value, id]);
  }

  return (
    <div>
      <label className={LABEL_CLASS}>แท็ก</label>
      {loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          โหลดแท็ก…
        </div>
      ) : tags.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const selected = value.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={cn(
                  'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                  selected
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}