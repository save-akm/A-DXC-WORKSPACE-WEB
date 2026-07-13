'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Radio,
  Star,
  AlertTriangle,
  Search,
  Plus,
  Pencil,
  Trash2,
  Shield,
  CalendarRange,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { StatCard } from '@/components/management/stat-card';
import { PageHeader } from '@/components/management/page-header';
import { ActionMenu } from '@/components/management/action-menu';
import { Pagination } from '@/components/management/pagination';
import { ActiveToggle } from '../apps/_components/active-toggle';
import { ConfirmDialog } from '@/components/management/confirm-dialog';

import {
  fetchAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/lib/api/announcements';
import {
  getAnnouncementState,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_LEVELS,
  type Announcement,
  type AnnouncementType,
  type AnnouncementLevel,
  type CreateAnnouncementInput,
} from '@/lib/announcements/types';
import {
  TYPE_CONFIG,
  LEVEL_CONFIG,
  TypeBadge,
  LevelBadge,
  StateBadge,
} from './_components/announcement-meta';
import { AnnouncementModal } from './_components/announcement-modal';

// ── Animation helpers ────────────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});
const MotionTableRow = motion.create(TableRow);
const PAGE_SIZE = 10;

const COL_COUNT = 7;

// ── Date formatting ───────────────────────────────────────────────────────────────

const DTF = new Intl.DateTimeFormat('th-TH', {
  day: '2-digit',
  month: 'short',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const fmtDate = (iso: string | null) => (iso ? DTF.format(new Date(iso)) : null);

// ── Skeleton ──────────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 pl-4 sm:pl-5"><div className="h-3.5 w-5 animate-pulse rounded bg-muted" /></td>
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="size-9 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-56 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </td>
      <td className="hidden py-3 sm:table-cell"><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></td>
      <td className="py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-3.5 w-28 animate-pulse rounded bg-muted" /></td>
      <td className="py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></td>
      <td className="py-3 pr-3 sm:pr-4"><div className="size-6 animate-pulse rounded bg-muted" /></td>
    </tr>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('announcements');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  const hasView = noNode || canView;
  const hasCreate = noNode || canCreate;
  const hasUpdate = noNode || canUpdate;
  const hasDelete = noNode || canDelete;

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | AnnouncementType>('All');
  const [levelFilter, setLevelFilter] = useState<'All' | AnnouncementLevel>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'inactive'>('All');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAdminAnnouncements()
      .then(setItems)
      .catch((err) => toast.error((err as Error)?.message || 'โหลดประกาศไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, typeFilter, levelFilter, statusFilter, priorityOnly]);

  // ── Mutations ──
  const handleCreate = useCallback(async (input: CreateAnnouncementInput) => {
    const created = await createAnnouncement(input);
    setItems((prev) => [created, ...prev]);
    toast.success('สร้างประกาศสำเร็จ');
  }, []);

  const handleUpdate = useCallback(async (id: string, input: CreateAnnouncementInput) => {
    const updated = await updateAnnouncement(id, input);
    setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
    toast.success('บันทึกการแก้ไขสำเร็จ');
  }, []);

  const handleToggleActive = useCallback(async (a: Announcement) => {
    const next = !a.isActive;
    setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, isActive: next } : it)));
    try {
      await updateAnnouncement(a.id, { isActive: next });
    } catch (err) {
      setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, isActive: a.isActive } : it)));
      toast.error((err as Error)?.message || 'เปลี่ยนสถานะไม่สำเร็จ');
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(deleteTarget.id);
      setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success('ลบประกาศสำเร็จ');
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error)?.message || 'ลบประกาศไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  // ── Derived ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) => {
      const matchSearch = !q || a.header.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q);
      const matchType = typeFilter === 'All' || a.type === typeFilter;
      const matchLevel = levelFilter === 'All' || a.level === levelFilter;
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'active' && a.isActive) ||
        (statusFilter === 'inactive' && !a.isActive);
      const matchPriority = !priorityOnly || a.isPriority;
      return matchSearch && matchType && matchLevel && matchStatus && matchPriority;
    });
  }, [items, search, typeFilter, levelFilter, statusFilter, priorityOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: items.length,
    live: items.filter((a) => getAnnouncementState(a) === 'LIVE').length,
    priority: items.filter((a) => a.isPriority).length,
    urgent: items.filter((a) => a.level === 'CRITICAL' || a.level === 'URGENT').length,
  }), [items]);

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

      {/* ── Header ── */}
      <PageHeader
        icon={Megaphone}
        title="ประกาศ"
        subtitle="จัดการประกาศและ banner ที่แสดงบนระบบ"
        actions={
          hasCreate && (
            <Button variant="create" size="lg" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
              <Plus />
              <span className="hidden sm:inline">สร้างประกาศ</span>
              <span className="sm:hidden">สร้าง</span>
            </Button>
          )
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div {...fadeUp(0.08)}><StatCard icon={Megaphone}     label="ทั้งหมด"       value={stats.total}    gradient="from-violet-500 to-fuchsia-500" /></motion.div>
        <motion.div {...fadeUp(0.14)}><StatCard icon={Radio}         label="กำลังแสดง"     value={stats.live}     gradient="from-emerald-500 to-teal-500"   /></motion.div>
        <motion.div {...fadeUp(0.20)}><StatCard icon={Star}          label="ปักหมุดสำคัญ"  value={stats.priority} gradient="from-amber-500 to-orange-500"   /></motion.div>
        <motion.div {...fadeUp(0.26)}><StatCard icon={AlertTriangle} label="ระดับสูง"      value={stats.urgent}   gradient="from-rose-500 to-red-600"       /></motion.div>
      </div>

      {/* ── Toolbar ── */}
      <motion.div {...fadeUp(0.32)} className="flex flex-col gap-2.5">
        <div className="relative w-full sm:max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="ค้นหาหัวข้อหรือรายละเอียด…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type pills */}
          <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-card/40 p-0.5">
            {(['All', ...ANNOUNCEMENT_TYPES] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  typeFilter === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {typeFilter === t && (
                  <motion.span
                    layoutId="ann-type-tab-bg"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {t === 'All' ? 'ทุกประเภท' : TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          {/* Level pills */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {(['All', ...ANNOUNCEMENT_LEVELS] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  levelFilter === l ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {levelFilter === l && (
                  <motion.span
                    layoutId="ann-level-tab-bg"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {l === 'All' ? 'ทุกระดับ' : LEVEL_CONFIG[l].label}
              </button>
            ))}
          </div>

          {/* Status pills */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {([['All', 'ทั้งหมด'], ['active', 'เปิด'], ['inactive', 'ปิด']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === val ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {statusFilter === val && (
                  <motion.span
                    layoutId="ann-status-tab-bg"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {label}
              </button>
            ))}
          </div>

          {/* Priority toggle */}
          <button
            onClick={() => setPriorityOnly((v) => !v)}
            className={cn(
              'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              priorityOnly
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
            )}
          >
            <Star size={12} className={cn(priorityOnly && 'fill-amber-500')} />
            ปักหมุด
          </button>
        </div>
      </motion.div>

      {/* ── Table ── */}
      <motion.div {...fadeUp(0.40)}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 pl-4 text-xs sm:pl-5">#</TableHead>
                    <TableHead className="text-xs">ประกาศ</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">ประเภท</TableHead>
                    <TableHead className="text-xs">ระดับ</TableHead>
                    <TableHead className="hidden text-xs lg:table-cell">ช่วงเวลา</TableHead>
                    <TableHead className="text-xs">สถานะ</TableHead>
                    <TableHead className="w-10 pr-3 sm:w-12 sm:pr-4" />
                  </TableRow>
                </TableHeader>

                {loading ? (
                  <tbody>
                    {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
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
                      {paged.length === 0 && (
                        <tr>
                          <td colSpan={COL_COUNT} className="py-20 text-center text-sm text-muted-foreground">
                            ไม่พบประกาศ
                          </td>
                        </tr>
                      )}
                      {paged.map((a, i) => {
                        const typeCfg = TYPE_CONFIG[a.type];
                        const state = getAnnouncementState(a);
                        const start = fmtDate(a.startsAt);
                        const end = fmtDate(a.endsAt);
                        return (
                          <MotionTableRow
                            key={a.id}
                            className="group"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.04, ease: EASE }}
                          >
                            <TableCell className="pl-4 text-xs text-muted-foreground sm:pl-5">
                              {(page - 1) * PAGE_SIZE + i + 1}
                            </TableCell>

                            {/* Announcement */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  'flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-sm',
                                  typeCfg.gradient,
                                )}>
                                  <AppIcon name={a.icon} className="size-4" />
                                </span>
                                <div className="min-w-0 max-w-xs">
                                  <p className="flex items-center gap-1.5 truncate text-sm font-medium leading-tight">
                                    {a.isPriority && <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" />}
                                    <span className="truncate">{a.header}</span>
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Type */}
                            <TableCell className="hidden sm:table-cell">
                              <TypeBadge type={a.type} />
                            </TableCell>

                            {/* Level */}
                            <TableCell><LevelBadge level={a.level} /></TableCell>

                            {/* Schedule */}
                            <TableCell className="hidden lg:table-cell">
                              {start || end ? (
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CalendarRange size={12} className="shrink-0" />
                                  <span className="tabular-nums">{start ?? '—'}</span>
                                  <ArrowRight size={10} className="shrink-0 opacity-60" />
                                  <span className="tabular-nums">{end ?? '—'}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/60">ตลอดเวลา</span>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {hasUpdate ? (
                                  <ActiveToggle
                                    active={a.isActive}
                                    showLabel={false}
                                    onToggle={() => handleToggleActive(a)}
                                  />
                                ) : null}
                                <StateBadge state={state} />
                              </div>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="pr-3 sm:pr-4">
                              <ActionMenu actions={[
                                ...(hasUpdate ? [{ label: 'แก้ไข', icon: Pencil, onClick: () => { setEditTarget(a); setModalOpen(true); } }] : []),
                                ...(hasDelete ? [{ label: 'ลบ', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(a) }] : []),
                              ]} />
                            </TableCell>
                          </MotionTableRow>
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
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              layoutId="announcements-page-active-bg"
              itemLabel="ประกาศ"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Create / Edit Modal ── */}
      <AnnouncementModal
        key={editTarget?.id ?? 'new'}
        open={modalOpen}
        announcement={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={(input) => (editTarget ? handleUpdate(editTarget.id, input) : handleCreate(input))}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบประกาศ"
        loading={deleting}
        message={
          <>
            ลบ <span className="font-semibold text-foreground">{deleteTarget?.header}</span> ออกจากระบบ?
            การกระทำนี้ไม่สามารถยกเลิกได้
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
