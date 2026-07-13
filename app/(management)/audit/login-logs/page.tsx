'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Search, Shield, X, ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/management/page-header';
import { Pagination } from '@/components/management/pagination';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { fetchLoginLogs } from '@/lib/api/audit';
import { LOGIN_STATUSES, type LoginLog, type LoginStatus } from '@/lib/audit/types';
import { statusMeta, failureReasonLabel, formatLogDate, formatLogTime, formatRelative } from '@/lib/audit/format';
import { StatusBadge, EmptyState, InitialAvatar, Mono } from '../_components/log-ui';
import { LoginDetailSheet } from './_components/login-detail-sheet';

const PAGE_SIZE = 20;
const EASE = [0.4, 0, 0.2, 1] as const;

const STATUS_LABEL: Record<LoginStatus, string> = {
  SUCCESS: 'สำเร็จ',
  FAILURE: 'ล้มเหลว',
  BLOCKED: 'ถูกบล็อก',
};

function DeviceIcon({ type }: { type: string | null }) {
  const t = (type ?? '').toLowerCase();
  const Icon = t.includes('mobile') || t.includes('phone') ? Smartphone : t.includes('tablet') ? Tablet : Monitor;
  return <Icon className="size-3.5 shrink-0 text-muted-foreground" />;
}

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
      <td className="py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-3 w-28 animate-pulse rounded bg-muted" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-3 w-20 animate-pulse rounded bg-muted" /></td>
      <td className="py-3 pr-4"><div className="ml-auto size-4 animate-pulse rounded bg-muted" /></td>
    </tr>
  );
}

export default function LoginLogsPage() {
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('login_logs');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  const hasView = noNode || canView;

  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LoginStatus | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<LoginLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchLoginLogs({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status === 'ALL' ? undefined : status,
      from: fromDate ? `${fromDate}T00:00:00.000+07:00` : undefined,
      to: toDate ? `${toDate}T23:59:59.999+07:00` : undefined,
    })
      .then((res) => { setLogs(res.logs); setTotal(res.total); })
      .catch((e) => setError((e as Error)?.message ?? 'โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [page, search, status, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const handleStatus = (s: LoginStatus | 'ALL') => { setStatus(s); setPage(1); };
  const handleFrom = (v: string) => { setFromDate(v); setPage(1); };
  const handleTo = (v: string) => { setToDate(v); setPage(1); };
  const clearDates = () => { setFromDate(''); setToDate(''); setPage(1); };

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
        icon={KeyRound}
        title="Login Logs"
        subtitle="ประวัติการเข้าสู่ระบบทั้งหมด — สำเร็จ ล้มเหลว และถูกบล็อก"
      />

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="ค้นหา identifier หรือ IP…"
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

        {/* Status segmented control */}
        <div className="flex shrink-0 items-center gap-0.5 self-start rounded-lg border border-border/60 bg-card/40 p-0.5 sm:self-auto">
          {(['ALL', ...LOGIN_STATUSES] as const).map((s) => {
            const active = status === s;
            const label = s === 'ALL' ? 'ทั้งหมด' : STATUS_LABEL[s];
            return (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                className={cn(
                  'relative z-10 cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="login-status-tab-bg"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="inline-flex items-center gap-1.5">
                  {s !== 'ALL' && <span className={cn('size-1.5 rounded-full', statusMeta(s).dot)} />}
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">ช่วงเวลา</span>
          <Input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => handleFrom(e.target.value)}
            className="h-8 w-auto text-xs"
            aria-label="ตั้งแต่วันที่"
          />
          <span>—</span>
          <Input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => handleTo(e.target.value)}
            className="h-8 w-auto text-xs"
            aria-label="ถึงวันที่"
          />
          {(fromDate || toDate) && (
            <button
              onClick={clearDates}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={12} /> ล้าง
            </button>
          )}
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
                    <TableHead className="text-xs">ผู้ใช้ / Identifier</TableHead>
                    <TableHead className="text-xs">สถานะ</TableHead>
                    <TableHead className="hidden text-xs md:table-cell">อุปกรณ์</TableHead>
                    <TableHead className="hidden text-xs lg:table-cell">IP</TableHead>
                    <TableHead className="w-10 pr-4" />
                  </TableRow>
                </TableHeader>

                {loading ? (
                  <tbody>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} index={i} />)}</tbody>
                ) : error ? (
                  <tbody><tr><td colSpan={6}><EmptyState icon={<Shield className="size-9" />} title="โหลดข้อมูลไม่สำเร็จ" hint={error} /></td></tr></tbody>
                ) : logs.length === 0 ? (
                  <tbody><tr><td colSpan={6}><EmptyState icon={<KeyRound className="size-9" />} title="ไม่พบบันทึก" hint="ลองปรับคำค้นหาหรือตัวกรอง" /></td></tr></tbody>
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.tbody
                      key={`${page}-${status}-${search}`}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      {logs.map((log, i) => {
                        const name = log.user
                          ? [log.user.firstName, log.user.lastName].filter(Boolean).join(' ').trim() || log.user.email
                          : log.identifier;
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
                                <InitialAvatar name={name} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium leading-tight">{name}</p>
                                  <p className="truncate text-[11px] text-muted-foreground">{log.identifier}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5">
                              <div className="flex flex-col items-start gap-0.5">
                                <StatusBadge status={log.status} />
                                {log.status !== 'SUCCESS' && log.failureReason && (
                                  <span className="text-[11px] text-muted-foreground">{failureReasonLabel(log.failureReason)}</span>
                                )}
                              </div>
                            </td>
                            <td className="hidden py-2.5 md:table-cell">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <DeviceIcon type={log.deviceType} />
                                <span className="truncate">
                                  {[log.browser, log.os].filter(Boolean).join(' · ') || log.deviceType || '—'}
                                </span>
                              </div>
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
              layoutId="login-logs-page-active-bg"
              itemLabel="รายการ"
            />
          </CardContent>
        </Card>
      </motion.div>

      <LoginDetailSheet row={selected} open={selected !== null} onClose={() => setSelected(null)} />
    </div>
  );
}
