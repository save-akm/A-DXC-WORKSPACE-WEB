'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, ChevronRight } from 'lucide-react';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/management/pagination';
import { fetchActivityInvitationHistory } from '@/lib/api/activity-invitations';
import type { InvitationBatchListItem } from '@/lib/activity/invitation-types';
import {
  InvitationBatchStatusBadge,
  formatInvitationTargets,
  formatSentBy,
  humanizeInvitationError,
} from './invitation-meta';
import { InvitationBatchDrawer } from './invitation-batch-drawer';

const PAGE_SIZE = 10;

interface InvitationHistorySectionProps {
  activityId: string;
  canSend?: boolean;
  onSendClick?: () => void;
  /** Bump to reload history after a successful send. */
  refreshToken?: number;
}

export function InvitationHistorySection({
  activityId,
  canSend = false,
  onSendClick,
  refreshToken = 0,
}: InvitationHistorySectionProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InvitationBatchListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState<InvitationBatchListItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityInvitationHistory(activityId, {
        page,
        limit: PAGE_SIZE,
      });
      setItems(data.items);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(humanizeInvitationError(err));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activityId, page, refreshToken]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (refreshToken > 0) setPage(1);
  }, [refreshToken]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openBatch(batch: InvitationBatchListItem) {
    setSelectedBatch(batch);
    setDrawerOpen(true);
  }

  return (
    <>
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-bold">ประวัติการส่งเชิญ</h2>
            {!loading && (
              <span className="text-xs text-muted-foreground">({total})</span>
            )}
          </div>
          {canSend && onSendClick && (
            <button
              type="button"
              onClick={onSendClick}
              className="cursor-pointer rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              ส่งเชิญใหม่
            </button>
          )}
        </div>

        {loading && (
          <div className="overflow-hidden rounded-xl border border-border/60">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 border-b border-border/40 px-4 py-3 last:border-0">
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 cursor-pointer text-xs font-semibold text-primary hover:underline"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีประวัติการส่งเชิญ
            {canSend && onSendClick && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={onSendClick}
                  className="cursor-pointer font-semibold text-primary hover:underline"
                >
                  ส่งเชิญครั้งแรก
                </button>
              </>
            )}
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 sm:pl-5">หัวข้อ</TableHead>
                  <TableHead className="hidden md:table-cell">เป้าหมาย</TableHead>
                  <TableHead>ผลลัพธ์</TableHead>
                  <TableHead className="hidden lg:table-cell">ส่งโดย</TableHead>
                  <TableHead className="hidden sm:table-cell">วันที่</TableHead>
                  <TableHead className="w-8 pr-4 sm:pr-5" />
                </TableRow>
              </TableHeader>
              <tbody>
                {items.map((batch) => (
                  <TableRow
                    key={batch.id}
                    className="cursor-pointer"
                    onClick={() => openBatch(batch)}
                  >
                    <TableCell className="max-w-[200px] pl-4 sm:pl-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{batch.subject}</p>
                        <InvitationBatchStatusBadge status={batch.status} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {formatInvitationTargets(batch.targets)}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      <span className="text-emerald-600 dark:text-emerald-400">{batch.sentCount}</span>
                      {' / '}
                      {batch.recipientCount}
                      {batch.failedCount > 0 && (
                        <span className="ml-1 text-destructive">({batch.failedCount} ล้มเหลว)</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatSentBy(batch.sentBy)}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {new Date(batch.createdAt).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground sm:pr-5">
                      <ChevronRight className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={setPage}
                layoutId="invitation-history-pagination"
                itemLabel="รายการ"
              />
            )}
          </div>
        )}
      </section>

      <InvitationBatchDrawer
        activityId={activityId}
        batch={selectedBatch}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}