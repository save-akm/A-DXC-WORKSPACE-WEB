'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardList, Eye, Inbox, Pencil, Plus, Search, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { ActionMenu, type ActionItem } from '@/components/management/action-menu';
import { ConfirmDialog } from '@/components/management/confirm-dialog';
import { PageHeader } from '@/components/management/page-header';
import { Pagination } from '@/components/management/pagination';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { deleteSurvey, fetchReviewInbox, fetchSurveys } from '@/lib/api/project-surveys';
import type { SurveyListItem, SurveyStatus } from '@/lib/project-survey/types';
import {
  STATUS_LABELS, TYPE_SYSTEM_LABELS, formatDateTime, fullName,
} from '@/lib/project-survey/labels';
import { SurveyStatusBadge } from './_components/survey-status';

const PAGE_SIZE = 20;
const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

type Scope = 'all' | 'mine' | 'inbox';
const STATUS_FILTERS: (SurveyStatus | 'ALL')[] = ['ALL', 'SEND', 'REVIEW', 'APPROVE'];

const MotionTableRow = motion.create(TableRow);

export default function ProjectSurveyListPage() {
  const router = useRouter();
  const meId = useAuthStore((s) => s.user?.id ?? '');
  const { canCreate, canUpdate, canDelete } = useMenuPermission('project_survey');

  const [scope, setScope] = useState<Scope>('all');
  const [status, setStatus] = useState<SurveyStatus | 'ALL'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<SurveyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<SurveyListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce keyword → server search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => { setPage(1); }, [scope, status, debounced]);

  const requestSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        keyword: debounced || undefined,
        status: status === 'ALL' ? undefined : status,
        mine: scope === 'mine' || undefined,
      };
      const res = scope === 'inbox' ? await fetchReviewInbox(params) : await fetchSurveys(params);
      if (seq !== requestSeq.current) return;
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(Math.max(1, res.totalPages));
    } catch {
      if (seq !== requestSeq.current) return;
      toast.error('โหลดรายการคำร้องไม่สำเร็จ');
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [page, debounced, status, scope]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSurvey(deleteTarget.id);
      toast.success(`ลบคำร้อง ${deleteTarget.docNo} สำเร็จ`);
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบคำร้องไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, load]);

  const scopeTabs = useMemo(() => {
    const tabs: { key: Scope; label: string; icon?: typeof Inbox }[] = [
      { key: 'all', label: 'ทั้งหมด' },
      { key: 'mine', label: 'ของฉัน' },
    ];
    if (canUpdate) tabs.push({ key: 'inbox', label: 'กล่องตรวจสอบ', icon: Inbox });
    return tabs;
  }, [canUpdate]);

  const rowActions = useCallback((item: SurveyListItem): ActionItem[] => {
    const actions: ActionItem[] = [
      { label: 'ดูรายละเอียด', icon: Eye, onClick: () => router.push(`/project-survey/${item.id}`) },
    ];
    const isOwner = item.requesterId === meId || item.createdById === meId;
    if (item.status === 'SEND' && isOwner) {
      actions.push({ label: 'แก้ไข', icon: Pencil, onClick: () => router.push(`/project-survey/${item.id}/edit`) });
      if (canUpdate || canDelete) {
        actions.push({ label: 'ลบ', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(item) });
      }
    }
    return actions;
  }, [router, meId, canUpdate, canDelete]);

  // Inbox only ever holds SEND / REVIEW — hide the APPROVE filter there.
  const statusFilters = scope === 'inbox'
    ? STATUS_FILTERS.filter((s) => s !== 'APPROVE')
    : STATUS_FILTERS;

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <PageHeader
        title="Project Survey"
        subtitle="คำร้องสำรวจโครงการ — ส่งคำร้อง ตรวจสอบ และอนุมัติ"
        icon={ClipboardList}
        actions={
          canCreate && (
            <Button variant="create" size="lg" onClick={() => router.push('/project-survey/new')}>
              <Plus />
              <span className="hidden sm:inline">สร้างคำร้อง</span>
              <span className="sm:hidden">ใหม่</span>
            </Button>
          )
        }
      />

      {/* Toolbar */}
      <motion.div {...fadeUp(0.08)} className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="ค้นหาเลขที่เอกสาร หรือชื่อโครงการ…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="ค้นหาคำร้อง"
          />
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
          {scopeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setScope(tab.key)}
              className={cn(
                'relative z-10 flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                scope === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {scope === tab.key && (
                <motion.span
                  layoutId="ps-scope-bg"
                  className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {tab.icon && <tab.icon size={12} />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                status === s ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {status === s && (
                <motion.span
                  layoutId="ps-status-bg"
                  className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {s === 'ALL' ? 'ทุกสถานะ' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.16)}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10 pl-4 text-xs">#</TableHead>
                  <TableHead className="text-xs">เอกสาร</TableHead>
                  <TableHead className="hidden text-xs sm:table-cell">ผู้ขอ</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">หน่วยงาน</TableHead>
                  <TableHead className="hidden text-xs lg:table-cell">ระบบ / KI</TableHead>
                  <TableHead className="text-xs">สถานะ</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">อัปเดตล่าสุด</TableHead>
                  <TableHead className="w-10 pr-3 sm:w-12 sm:pr-4" />
                </TableRow>
              </TableHeader>
              <AnimatePresence mode="wait" initial={false}>
                <TableBody key={`${scope}-${status}-${page}-${debounced}`}>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell className="pl-4"><div className="h-3 w-4 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                            <div className="h-3.5 w-48 animate-pulse rounded bg-muted" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="size-8 animate-pulse rounded-full bg-muted" />
                            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><div className="h-3 w-24 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><div className="h-3 w-20 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></TableCell>
                        <TableCell className="hidden md:table-cell"><div className="h-3 w-24 animate-pulse rounded bg-muted" /></TableCell>
                        <TableCell className="pr-4" />
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                            <ClipboardList size={20} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {scope === 'inbox' ? 'ไม่มีคำร้องรอตรวจสอบ' : 'ไม่พบคำร้อง'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {debounced || status !== 'ALL'
                                ? 'ลองปรับคำค้นหาหรือตัวกรองสถานะ'
                                : scope === 'inbox'
                                  ? 'คำร้องที่ส่งเข้ามาใหม่จะปรากฏที่นี่'
                                  : 'เริ่มต้นด้วยการสร้างคำร้องแรกของคุณ'}
                            </p>
                          </div>
                          {canCreate && !debounced && status === 'ALL' && scope !== 'inbox' && (
                            <Button variant="create" size="sm" onClick={() => router.push('/project-survey/new')}>
                              <Plus />
                              สร้างคำร้อง
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, i) => (
                      <MotionTableRow
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03, ease: EASE }}
                        onClick={() => router.push(`/project-survey/${item.id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell className="pl-4 text-xs text-muted-foreground">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-[11px] text-muted-foreground">{item.docNo}</p>
                          <p className="max-w-64 truncate text-sm font-medium leading-tight">{item.projectName}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              avatarUrl={item.requester?.avatarUrl}
                              initial={(item.requester?.firstName?.[0] ?? item.requesterName?.[0] ?? '?').toUpperCase()}
                              color="bg-violet-500"
                              size="sm"
                            />
                            <p className="max-w-32 truncate text-xs">{fullName(item.requester) === '—' ? item.requesterName : fullName(item.requester)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-xs">{item.department?.name ?? '—'}</p>
                          <p className="text-[11px] text-muted-foreground">{item.branch?.name ?? '—'}</p>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p className="text-xs">{TYPE_SYSTEM_LABELS[item.typeSystem]}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.kiYear?.name ?? '—'} · {item.budgetType?.name ?? '—'}
                          </p>
                        </TableCell>
                        <TableCell><SurveyStatusBadge status={item.status} /></TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {formatDateTime(item.updatedAt)}
                        </TableCell>
                        <TableCell className="pr-3 sm:pr-4" onClick={(e) => e.stopPropagation()}>
                          <ActionMenu actions={rowActions(item)} />
                        </TableCell>
                      </MotionTableRow>
                    ))
                  )}
                </TableBody>
              </AnimatePresence>
            </Table>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              layoutId="ps-list-page-bg"
              itemLabel="คำร้อง"
            />
          </CardContent>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="ลบคำร้อง"
        message={
          <>ต้องการลบคำร้อง <span className="font-medium text-foreground">{deleteTarget?.docNo}</span>{' '}
            &ldquo;{deleteTarget?.projectName}&rdquo; หรือไม่? การลบไม่สามารถย้อนกลับได้</>
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
