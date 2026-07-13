'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Pencil, Trash2, Users } from 'lucide-react';
import {
  Table, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ActionMenu } from '@/components/management/action-menu';
import type { DepartmentUnit } from '@/lib/api/organization';
import { RowSkeleton, EmptyRow, MotionTableRow, EASE, PAGE_SIZE } from './table-helpers';

interface DepartmentUnitsTableProps {
  rows:      DepartmentUnit[];
  loading:   boolean;
  page:      number;
  onEdit:    (unit: DepartmentUnit) => void;
  onDelete:  (unit: DepartmentUnit) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function DepartmentUnitsTable({
  rows, loading, page, onEdit, onDelete, canUpdate, canDelete,
}: DepartmentUnitsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
          <TableHead className="w-10 pl-4 text-xs">#</TableHead>
          <TableHead className="hidden text-xs md:table-cell">Department</TableHead>
          <TableHead className="text-xs">Code</TableHead>
          <TableHead className="text-xs">Unit Name</TableHead>
          <TableHead className="hidden text-xs xl:table-cell">Description</TableHead>
          <TableHead className="hidden text-xs lg:table-cell">Users</TableHead>
          <TableHead className="w-10 pr-4" />
        </TableRow>
      </TableHeader>

      {loading ? (
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} cols={7} index={i} />
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
            {rows.length === 0 && <EmptyRow colSpan={7} />}
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
                <TableCell className="hidden md:table-cell">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 size={11} />
                    {row.departmentName ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.code}
                </TableCell>
                <TableCell className="text-sm font-medium">{row.name}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  {row.description ? (
                    <span className="block max-w-56 truncate text-xs text-muted-foreground" title={row.description}>
                      {row.description}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={11} />
                    {row._count?.users ?? 0}
                  </span>
                </TableCell>
                <TableCell className="pr-4">
                  {(canUpdate || canDelete) && (
                    <ActionMenu actions={[
                      ...(canUpdate ? [{ label: 'Edit',   icon: Pencil, onClick: () => onEdit(row) }]   : []),
                      ...(canDelete ? [{ label: 'Delete', icon: Trash2, destructive: true as const, onClick: () => onDelete(row) }] : []),
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
