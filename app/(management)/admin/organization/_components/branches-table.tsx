'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Table, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ActionMenu } from '@/components/management/action-menu';
import type { Branch } from '@/lib/api/organization';
import { RowSkeleton, EmptyRow, MotionTableRow, EASE, PAGE_SIZE } from './table-helpers';

interface BranchesTableProps {
  rows:      Branch[];
  loading:   boolean;
  page:      number;
  onEdit:    (branch: Branch) => void;
  onDelete:  (branch: Branch) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function BranchesTable({
  rows, loading, page,
  onEdit, onDelete,
  canUpdate, canDelete,
}: BranchesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
          <TableHead className="w-10 pl-4 text-xs">#</TableHead>
          <TableHead className="text-xs">Code</TableHead>
          <TableHead className="text-xs">Branch Name</TableHead>
          <TableHead className="hidden text-xs md:table-cell">Phone</TableHead>
          <TableHead className="hidden text-xs lg:table-cell">Address</TableHead>
          <TableHead className="w-10 pr-4" />
        </TableRow>
      </TableHeader>

      {loading ? (
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} cols={6} index={i} />
          ))}
        </tbody>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.tbody
            key={page}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {rows.length === 0 && <EmptyRow colSpan={6} />}
            {rows.map((row, i) => (
              <MotionTableRow
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: EASE }}
              >
                <TableCell className="pl-4 text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + i + 1}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-medium">{row.code}</span>
                </TableCell>
                <TableCell className="text-sm font-medium">{row.name}</TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {row.phone ?? '—'}
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate text-xs text-muted-foreground lg:table-cell">
                  {row.address ?? '—'}
                </TableCell>
                <TableCell className="pr-4">
                  {(canUpdate || canDelete) && (
                    <ActionMenu actions={[
                      ...(canUpdate ? [{ label: 'Edit',   icon: Pencil, onClick: () => onEdit(row) }] : []),
                      ...(canDelete ? [{ label: 'Delete', icon: Trash2, destructive: true, onClick: () => onDelete(row) }] : []),
                    ]} />
                  )}
                </TableCell>
              </MotionTableRow>
            ))}
          </motion.tbody>
        </AnimatePresence>
      )}
    </Table>
  );
}
