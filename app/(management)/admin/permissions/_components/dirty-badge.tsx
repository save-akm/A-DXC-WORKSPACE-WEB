// app/(management)/admin/permissions/_components/dirty-badge.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface DirtyBadgeProps {
  count: number;
  onDiscard: () => void;
}

export function DirtyBadge({ count, onDiscard }: DirtyBadgeProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="dirty-badge"
          initial={{ opacity: 0, x: 16, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 16, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-400">
            <span className="animate-pulse size-1.5 rounded-full bg-amber-400" />
            <span>{count} รายการที่เปลี่ยน</span>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            ↩ ยกเลิก
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
