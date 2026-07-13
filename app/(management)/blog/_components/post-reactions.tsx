'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart, Lightbulb, Sparkles, Brain, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { fetchReactions, toggleReaction } from '@/lib/api/blog';
import {
  type ReactionSummary,
  type ReactionType,
  REACTION_TYPES,
  REACTION_LABELS,
  humanizeBlogError,
} from '@/lib/blog/types';

const REACTION_ICONS: Record<ReactionType, typeof Heart> = {
  LIKE: Heart,
  USEFUL: Lightbulb,
  AWESOME: Sparkles,
  SMART: Brain,
  WORKED: CheckCircle2,
};

// Active = tinted bg + dark text of the same hue (WCAG AA in both themes) —
// same vocabulary as StatusBadge, instead of white-on-solid which failed AA.
const REACTION_ACTIVE: Record<ReactionType, string> = {
  LIKE:    'border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-400',
  USEFUL:  'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400',
  AWESOME: 'border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-400',
  SMART:   'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-400',
  WORKED:  'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
};

const REACTION_HOVER: Record<ReactionType, string> = {
  LIKE:    'hover:border-rose-300 hover:text-rose-500',
  USEFUL:  'hover:border-amber-300 hover:text-amber-500',
  AWESOME: 'hover:border-violet-300 hover:text-violet-500',
  SMART:   'hover:border-sky-300 hover:text-sky-500',
  WORKED:  'hover:border-emerald-300 hover:text-emerald-500',
};

interface PostReactionsProps {
  postId: string;
  className?: string;
}

export function PostReactions({ postId, className }: PostReactionsProps) {
  const [summary, setSummary] = useState<ReactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<ReactionType | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchReactions(postId)
      .then((s) => { if (alive) setSummary(s); })
      .catch(() => { /* non-fatal */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [postId]);

  const handleToggle = useCallback(async (type: ReactionType) => {
    // Optimistic update — single-select: deselect if same, switch if different.
    setSummary((cur) => {
      if (!cur) return cur;
      const prev = cur.myReaction;
      const next = prev === type ? null : type;
      const counts = { ...cur.counts };
      if (prev) counts[prev] = Math.max(0, (counts[prev] ?? 0) - 1);
      if (next) counts[next] = (counts[next] ?? 0) + 1;
      const totalDelta = next ? (prev ? 0 : 1) : -1;
      return { ...cur, myReaction: next, counts, total: (cur.total ?? 0) + totalDelta };
    });

    setToggling(type);
    try {
      const next = await toggleReaction(postId, type);
      setSummary(next);
    } catch (err) {
      // Revert optimistic update on failure.
      setSummary((cur) => {
        if (!cur) return cur;
        const revertTo = cur.myReaction === type ? null : type;
        const counts = { ...cur.counts };
        if (cur.myReaction) counts[cur.myReaction] = Math.max(0, (counts[cur.myReaction] ?? 0) - 1);
        if (revertTo) counts[revertTo] = (counts[revertTo] ?? 0) + 1;
        const totalDelta = revertTo ? (cur.myReaction ? 0 : 1) : -1;
        return { ...cur, myReaction: revertTo, counts, total: (cur.total ?? 0) + totalDelta };
      });
      toast.error(humanizeBlogError(err));
    } finally {
      setToggling(null);
    }
  }, [postId]);

  if (loading && !summary) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {REACTION_TYPES.map((t) => (
          <div key={t} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
    );
  }

  const counts = summary?.counts ?? Object.fromEntries(REACTION_TYPES.map((t) => [t, 0])) as Record<ReactionType, number>;
  const myReaction = summary?.myReaction ?? null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {REACTION_TYPES.map((type) => {
        const Icon = REACTION_ICONS[type];
        const active = myReaction === type;
        const count = counts[type] ?? 0;
        // Only the in-flight button locks — the update is optimistic, so the
        // others stay clickable.
        const busy = toggling === type;

        return (
          <button
            key={type}
            type="button"
            disabled={busy}
            onClick={() => handleToggle(type)}
            title={REACTION_LABELS[type]}
            aria-pressed={active}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
              active
                ? cn('font-semibold', REACTION_ACTIVE[type])
                : cn('border-border/60 bg-card/40 text-muted-foreground', REACTION_HOVER[type]),
              busy && 'opacity-70',
            )}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Icon className={cn('size-3.5', active && 'fill-current/25')} />
            )}
            <span>{REACTION_LABELS[type]}</span>
            {count > 0 && <span className="tabular-nums opacity-80">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
