'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/management/pagination';
import { fetchActivityInvitationBatch } from '@/lib/api/activity-invitations';
import {
  isInvitationBatchInProgress,
  type InvitationBatchListItem,
  type InvitationItemStatus,
} from '@/lib/activity/invitation-types';
import {
  InvitationBatchStatusBadge,
  InvitationItemStatusBadge,
  SOURCE_LABELS,
  formatInvitationTargets,
  formatSentBy,
  humanizeInvitationError,
  humanizeSkipReason,
  invitationDisplayName,
} from './invitation-meta';
import { cn } from '@/lib/utils';

const ITEM_PAGE_SIZE = 50;
const POLL_MS = 2500;
const STATUS_FILTERS: { value: '' | InvitationItemStatus; label: string }[] = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'SENT', label: 'ส่งแล้ว' },
  { value: 'FAILED', label: 'ล้มเหลว' },
  { value: 'SKIPPED', label: 'ข้าม' },
  { value: 'PENDING', label: 'รอส่ง' },
];

interface InvitationBatchDrawerProps {
  activityId: string;
  batch: InvitationBatchListItem | null;
  open: boolean;
  onClose: () => void;
}

export function InvitationBatchDrawer({
  activityId,
  batch,
  open,
  onClose,
}: InvitationBatchDrawerProps) {
  const [statusFilter, setStatusFilter] = useState<'' | InvitationItemStatus>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchActivityInvitationBatch>> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!batch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityInvitationBatch(activityId, batch.id, {
        status: statusFilter || undefined,
        page,
        limit: ITEM_PAGE_SIZE,
      });
      setDetail(data);
    } catch (err) {
      setError(humanizeInvitationError(err));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [activityId, batch, page, statusFilter]);

  useEffect(() => {
    if (!open || !batch) return;
    setPage(1);
    setStatusFilter('');
  }, [open, batch?.id]);

  useEffect(() => {
    if (!open || !batch) return;
    load();
  }, [open, batch, load]);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setError(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!open || !detail || !isInvitationBatchInProgress(detail.batch.status)) return;

    pollRef.current = setInterval(() => {
      load();
    }, POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, detail?.batch.status, load]);

  const totalPages = detail
    ? Math.max(1, Math.ceil(detail.pagination.total / detail.pagination.limit))
    : 1;

  const batchStatus = detail?.batch.status ?? batch?.status;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="text-base font-bold">รายละเอียดการส่งเชิญ</SheetTitle>
            {batchStatus && <InvitationBatchStatusBadge status={batchStatus} />}
            {isInvitationBatchInProgress(batchStatus) && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">กำลังอัปเดต…</span>
            )}
          </div>
          <SheetDescription className="line-clamp-2 text-left">
            {batch?.subject ?? '—'}
          </SheetDescription>
        </SheetHeader>

        {batch && (
          <div className="shrink-0 grid grid-cols-2 gap-2 border-b border-border/60 bg-muted/20 px-5 py-3 text-xs sm:grid-cols-4">
            <Stat label="ผู้รับ" value={detail?.batch.recipientCount ?? batch.recipientCount} />
            <Stat
              label="ส่งแล้ว"
              value={detail?.batch.sentCount ?? batch.sentCount}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <Stat
              label="ล้มเหลว"
              value={detail?.batch.failedCount ?? batch.failedCount}
              className="text-destructive"
            />
            <Stat label="ข้าม" value={detail?.batch.skippedCount ?? batch.skippedCount} />
          </div>
        )}

        {batch && (
          <div className="shrink-0 space-y-1 border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">เป้าหมาย:</span>{' '}
              {formatInvitationTargets(batch.targets)}
            </p>
            <p>
              <span className="font-medium text-foreground">ส่งโดย:</span>{' '}
              {formatSentBy(batch.sentBy)}
              {' · '}
              {new Date(batch.createdAt).toLocaleString('th-TH')}
              {batch.completedAt && (
                <>
                  {' · เสร็จ '}
                  {new Date(batch.completedAt).toLocaleString('th-TH')}
                </>
              )}
            </p>
          </div>
        )}

        <div className="shrink-0 flex flex-wrap gap-1.5 border-b border-border/60 px-5 py-2.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={cn(
                'cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors',
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && !detail && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <span className="mr-2 size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              กำลังโหลด…
            </div>
          )}

          {error && (
            <p className="px-5 py-8 text-center text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && detail && detail.invitations.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              ไม่พบรายการในตัวกรองนี้
            </p>
          )}

          {detail && detail.invitations.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">ผู้รับ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="hidden pr-5 sm:table-cell">เวลา</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {detail.invitations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-5">
                      {item.user ? (
                        <>
                          <p className="text-sm font-medium">{invitationDisplayName(item.user)}</p>
                          <p className="text-[10px] text-muted-foreground">{item.user.employeeId}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                      {item.skipReason && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {humanizeSkipReason(item.skipReason)}
                        </p>
                      )}
                      {item.errorMessage && (
                        <p className="mt-1 text-[10px] text-destructive">{item.errorMessage}</p>
                      )}
                      {item.sources.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.sources.map((s) => (
                            <span
                              key={s}
                              className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {SOURCE_LABELS[s]}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <InvitationItemStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="hidden pr-5 text-xs text-muted-foreground sm:table-cell">
                      {item.sentAt
                        ? new Date(item.sentAt).toLocaleString('th-TH')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        {detail && detail.pagination.total > 0 && (
          <div className="shrink-0 border-t border-border/60">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={detail.pagination.total}
              pageSize={ITEM_PAGE_SIZE}
              onChange={setPage}
              layoutId="invitation-batch-pagination"
              itemLabel="รายการ"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums', className)}>{value}</p>
    </div>
  );
}
