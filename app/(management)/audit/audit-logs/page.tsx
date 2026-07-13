'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Search, Shield, X, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/management/page-header';
import { Pagination } from '@/components/management/pagination';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { fetchAuditLogs } from '@/lib/api/audit';
import { AUDIT_ACTIONS, type AuditAction, type AuditLog } from '@/lib/audit/types';
import { actionMeta, formatLogDate, formatLogTime, formatRelative } from '@/lib/audit/format';
import {
  ActionBadge,
  EmptyState,
  InitialAvatar,
  Mono,
} from '../_components/log-ui';
import { AuditDetailSheet } from './_components/audit-detail-sheet';

const PAGE_SIZE = 20;
const EASE = [0.4, 0, 0.2, 1] as const;

function RowSkeleton({ index }: { index: number }) {
  return (
    <tr style={{ animationDelay: `${index * 40}ms` }} className="border-b">
      <td className="py-3 pl-4 sm:pl-5"><div className="h-3 w-16 animate-pulse rounded bg-muted" /></td>
      <td className="py-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 animate-pulse rounded-full bg-muted" />
          <div className="space-y-1.5"><div className="h-3 w-28 animate-pulse rounded bg-muted" /><div className="h-2.5 w-20 animate-pulse rounded bg-muted" /></div>
        </div>
      </td>
      <td className="py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-3 w-24 animate-pulse rounded bg-muted" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-3 w-20 animate-pulse rounded bg-muted" /></td>
      <td className="py-3 pr-4"><div className="ml-auto size-4 animate-pulse rounded bg-muted" /></td>
    </tr>
  );
}

export default function AuditLogsPage() {
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('audit_logs');
  // Only hard-block when the node exists but withholds VIEW. If the node isn't in
  // the menu tree at all, fall through (mirrors the users page).
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  const hasView = noNode || canView;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | 'ALL'>('ALL');
  // Actions actually seen in the data, accumulated across loads so the tab set
  // reflects real data without collapsing when a filter narrows the result.
  const [seenActions, setSeenActions] = useState<AuditAction[]>([]);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box → committed `search` term.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAuditLogs({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      action: action === 'ALL' ? undefined : action,
    })
      .then((res) => {
        setLogs(res.logs);
        setTotal(res.total);
        setSeenActions((prev) => {
          const set = new Set(prev);
          for (const l of res.logs) set.add(l.action);
          // Keep the canonical enum order, drop anything never seen.
          return AUDIT_ACTIONS.filter((a) => set.has(a));
        });
      })
      .catch((e) => setError((e as Error)?.message ?? 'โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [page, search, action]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleAction = (a: AuditAction | 'ALL') => { setAction(a); setPage(1); };

  const filterPills = useMemo<(AuditAction | 'ALL')[]>(() => ['ALL', ...seenActions], [seenActions]);

  if (!hasView) {
    return (
      <div className="page-shell flex flex-col items-center justify-center gap-3 py-32 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon={ScrollText}
        title="Audit Logs"
        subtitle="บันทึกการกระทำทั้งหมดในระบบ — ใคร ทำอะไร กับอะไร เมื่อไหร่"
      />

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex flex-col gap-3"
      >
        <div className="relative w-full sm:max-w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="ค้นหา ชื่อ, อีเมล หรือรหัสพนักงาน…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterPills.map((a) => {
            const active = action === a;
            const label = a === 'ALL' ? 'ทั้งหมด' : actionMeta(a).label;
            return (
              <button
                key={a}
                onClick={() => handleAction(a)}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-brand/30 bg-brand-muted text-brand'
                    : 'border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08, ease: EASE }}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-32 pl-4 text-xs sm:pl-5">เวลา</TableHead>
                    <TableHead className="text-xs">ผู้กระทำ</TableHead>
                    <TableHead className="text-xs">การกระทำ</TableHead>
                    <TableHead className="hidden text-xs md:table-cell">เป้าหมาย</TableHead>
                    <TableHead className="hidden text-xs lg:table-cell">IP</TableHead>
                    <TableHead className="w-10 pr-4" />
                  </TableRow>
                </TableHeader>

                {loading ? (
                  <tbody>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} index={i} />)}</tbody>
                ) : error ? (
                  <tbody><tr><td colSpan={6}><EmptyState icon={<Shield className="size-9" />} title="โหลดข้อมูลไม่สำเร็จ" hint={error} /></td></tr></tbody>
                ) : logs.length === 0 ? (
                  <tbody><tr><td colSpan={6}><EmptyState icon={<ScrollText className="size-9" />} title="ไม่พบบันทึก" hint="ลองปรับคำค้นหาหรือตัวกรอง" /></td></tr></tbody>
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.tbody
                      key={`${page}-${action}-${search}`}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      {logs.map((log, i) => {
                        const actor = log.actor?.name ?? log.actor?.email ?? 'ระบบ';
                        return (
                          <motion.tr
                            key={log.id}
                            onClick={() => setSelected(log)}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, delay: i * 0.025, ease: EASE }}
                            className="group cursor-pointer border-b transition-colors hover:bg-accent/40"
                          >
                            <td className="py-2.5 pl-4 sm:pl-5">
                              <div className="text-xs font-medium">{formatLogTime(log.createdAt)}</div>
                              <div className="text-[11px] text-muted-foreground" title={formatRelative(log.createdAt)}>
                                {formatLogDate(log.createdAt)}
                              </div>
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2.5">
                                <InitialAvatar name={actor} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium leading-tight">{actor}</p>
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {log.actor?.employeeId ?? log.actor?.email ?? '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5"><ActionBadge action={log.action} /></td>
                            <td className="hidden py-2.5 md:table-cell">
                              {log.entityType ? (
                                <div className="min-w-0">
                                  <p className="text-xs font-medium">{log.entityType}</p>
                                  {log.changeCount > 0 ? (
                                    <span
                                      className="block max-w-44 truncate text-[11px] text-muted-foreground"
                                      title={log.changedFields.join(', ')}
                                    >
                                      เปลี่ยน {log.changeCount} ฟิลด์: {log.changedFields.join(', ')}
                                    </span>
                                  ) : log.entityId ? (
                                    <Mono className="block max-w-44 truncate text-muted-foreground">{log.entityId}</Mono>
                                  ) : null}
                                </div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="hidden py-2.5 lg:table-cell"><Mono className="text-muted-foreground">{log.ipAddress ?? '—'}</Mono></td>
                            <td className="py-2.5 pr-4">
                              <ChevronRight className="ml-auto size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                            </td>
                          </motion.tr>
                        );
                      })}
                    </motion.tbody>
                  </AnimatePresence>
                )}
              </Table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              layoutId="audit-logs-page-active-bg"
              itemLabel="รายการ"
            />
          </CardContent>
        </Card>
      </motion.div>

      <AuditDetailSheet log={selected} open={selected !== null} onClose={() => setSelected(null)} />
    </div>
  );
}
