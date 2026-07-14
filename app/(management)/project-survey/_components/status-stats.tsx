'use client';

import { motion } from 'framer-motion';
import { ClipboardList, type LucideIcon } from 'lucide-react';
import { StatCard } from '@/components/management/stat-card';
import type { SurveyStatus } from '@/lib/project-survey/types';
import { STATUS_LABELS } from '@/lib/project-survey/labels';
import type { SurveyStatusCounts } from '@/lib/api/project-surveys';
import { STATUS_STYLES } from './survey-status';

type Key = SurveyStatus | 'ALL';

interface StatusStatsProps {
  /** null while the counts are still in flight. */
  counts: SurveyStatusCounts | null;
  /** Statuses to show, in order — `ALL` first. Inbox passes a shorter set. */
  keys: Key[];
  selected: Key;
  onSelect: (key: Key) => void;
}

const EASE = [0.4, 0, 0.2, 1] as const;

const META: Record<Key, { label: string; gradient: string; icon: LucideIcon }> = {
  ALL:     { label: 'ทั้งหมด',              gradient: 'from-indigo-500 to-violet-500', icon: ClipboardList },
  DRAFT:   { label: STATUS_LABELS.DRAFT,   gradient: 'from-slate-400 to-slate-500',   icon: STATUS_STYLES.DRAFT.icon },
  SEND:    { label: STATUS_LABELS.SEND,    gradient: 'from-sky-500 to-blue-600',      icon: STATUS_STYLES.SEND.icon },
  REVIEW:  { label: STATUS_LABELS.REVIEW,  gradient: 'from-amber-500 to-orange-500',  icon: STATUS_STYLES.REVIEW.icon },
  APPROVE: { label: STATUS_LABELS.APPROVE, gradient: 'from-emerald-500 to-teal-500',  icon: STATUS_STYLES.APPROVE.icon },
  REJECT:  { label: STATUS_LABELS.REJECT,  gradient: 'from-rose-500 to-red-600',      icon: STATUS_STYLES.REJECT.icon },
};

/**
 * Per-status document counts, on the same StatCard tiles the rest of the
 * dashboard uses. They double as the status filter — one control for status
 * rather than a card row plus a pill row saying the same thing.
 */
export function StatusStats({ counts, keys, selected, onSelect }: StatusStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
      {keys.map((key, i) => {
        const { label, gradient, icon } = META[key];
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 + i * 0.05, ease: EASE }}
          >
            <StatCard
              icon={icon}
              label={label}
              value={counts?.[key] ?? 0}
              gradient={gradient}
              loading={counts == null}
              active={selected === key}
              onClick={() => onSelect(key)}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
