'use client';

import { motion } from 'framer-motion';
import { TableRow } from '@/components/ui/table';

export const EASE = [0.4, 0, 0.2, 1] as const;
export const PAGE_SIZE = 10;
export const MotionTableRow = motion.create(TableRow);

export function RowSkeleton({ cols, index }: { cols: number; index: number }) {
  return (
    <tr style={{ animationDelay: `${index * 40}ms` }}>
      <td className="py-3 pl-4">
        <div className="h-3.5 w-5 animate-pulse rounded bg-muted" />
      </td>
      {Array.from({ length: cols - 2 }).map((_, i) => (
        <td key={i} className="py-3 pr-4">
          <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        </td>
      ))}
      <td className="py-3 pr-4">
        <div className="size-6 animate-pulse rounded bg-muted" />
      </td>
    </tr>
  );
}

export function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-20 text-center text-sm text-muted-foreground">
        No data found
      </td>
    </tr>
  );
}
