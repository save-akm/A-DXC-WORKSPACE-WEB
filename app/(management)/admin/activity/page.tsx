'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PartyPopper,
  Star,
  Users,
  CalendarDays,
  Search,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Eye,
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
  fetchAdminActivities,
  fetchFeaturedSlots,
  fetchActivityTags,
  fetchAdminActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  uploadQueuedActivityImages,
} from '@/lib/api/activity';
import {
  ACTIVITY_STATUSES,
  type Activity,
  type ActivityStatus,
  type ActivityTag,
  type CreateActivityInput,
  type FeaturedSlots,
} from '@/lib/activity/types';
import {
  StatusBadge,
  FeaturedBadge,
  TagChip,
  humanizeActivityError,
} from './_components/activity-meta';
import { ActivityModal } from './_components/activity-modal';
import { TagPanel } from './_components/tag-panel';

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});
const MotionTableRow = motion.create(TableRow);
const PAGE_SIZE = 10;
const COL_COUNT = 8;

import { formatActivityDateRange } from '@/lib/activity/format';

function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 pl-4 sm:pl-5"><div className="h-3.5 w-5 animate-pulse rounded bg-muted" /></td>
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="size-9 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </td>
      <td className="hidden py-3 sm:table-cell"><div className="h-3.5 w-28 animate-pulse rounded bg-muted" /></td>
      <td className="py-3"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-3.5 w-8 animate-pulse rounded bg-muted" /></td>
      <td className="py-3"><div className="h-5 w-12 animate-pulse rounded-full bg-muted" /></td>
      <td className="py-3 pr-3 sm:pr-4"><div className="size-6 animate-pulse rounded bg-muted" /></td>
    </tr>
  );
}

export default function ActivityAdminPage() {
  const router = useRouter();
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('activity');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  const hasView = noNode || canView;
  const hasCreate = noNode || canCreate;
  const hasUpdate = noNode || canUpdate;
  const hasDelete = noNode || canDelete;

  const [items, setItems] = useState<Activity[]>([]);
  const [tags, setTags] = useState<ActivityTag[]>([]);
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlots | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ActivityStatus>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [activeFilter, setActiveFilter] = useState<'All' | 'active' | 'inactive'>('All');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [activities, tagList, slots] = await Promise.all([
        fetchAdminActivities({ limit: 100 }),
        fetchActivityTags(),
        fetchFeaturedSlots(),
      ]);
      setItems(activities);
      setTags(tagList);
      setFeaturedSlots(slots);
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [search, statusFilter, tagFilter, activeFilter, featuredOnly]);

  const handleCreate = useCallback(async (input: CreateActivityInput, pendingFiles: File[]) => {
    const created = await createActivity(input);
    if (pendingFiles.length > 0) {
      await uploadQueuedActivityImages(created.id, pendingFiles);
    }
    const item = pendingFiles.length > 0
      ? await fetchAdminActivity(created.id)
      : created;
    setItems((prev) => [item, ...prev]);
    const slots = await fetchFeaturedSlots();
    setFeaturedSlots(slots);
    toast.success(pendingFiles.length > 0 ? 'สร้างกิจกรรมและอัปโหลดรูปสำเร็จ' : 'สร้างกิจกรรมสำเร็จ');
  }, []);

  const handleUpdate = useCallback(async (id: string, input: CreateActivityInput) => {
    const updated = await updateActivity(id, input);
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    const slots = await fetchFeaturedSlots();
    setFeaturedSlots(slots);
    toast.success('บันทึกการแก้ไขสำเร็จ');
  }, []);

  const handleToggleActive = useCallback(async (a: Activity) => {
    const next = !a.isActive;
    setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, isActive: next } : it)));
    try {
      await updateActivity(a.id, { isActive: next });
    } catch (err) {
      setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, isActive: a.isActive } : it)));
      toast.error(humanizeActivityError(err));
    }
  }, []);

  const handleToggleFeatured = useCallback(async (a: Activity) => {
    const next = !a.isFeatured;
    if (next && featuredSlots && featuredSlots.remaining <= 0 && !a.isFeatured) {
      toast.error('ช่องแสดงหน้าบ้านเต็มแล้ว (สูงสุด 5 รายการ)');
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, isFeatured: next } : it)));
    try {
      await updateActivity(a.id, { isFeatured: next });
      const slots = await fetchFeaturedSlots();
      setFeaturedSlots(slots);
    } catch (err) {
      setItems((prev) => prev.map((it) => (it.id === a.id ? { ...it, isFeatured: a.isFeatured } : it)));
      toast.error(humanizeActivityError(err));
    }
  }, [featuredSlots]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteActivity(deleteTarget.id);
      setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      const slots = await fetchFeaturedSlots();
      setFeaturedSlots(slots);
      toast.success('ลบกิจกรรมสำเร็จ');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) => {
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.description?.toLowerCase().includes(q) ?? false) ||
        (a.location?.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchTag = tagFilter === 'All' || a.tags.some((t) => t.id === tagFilter);
      const matchActive =
        activeFilter === 'All' ||
        (activeFilter === 'active' && a.isActive) ||
        (activeFilter === 'inactive' && !a.isActive);
      const matchFeatured = !featuredOnly || a.isFeatured;
      return matchSearch && matchStatus && matchTag && matchActive && matchFeatured;
    });
  }, [items, search, statusFilter, tagFilter, activeFilter, featuredOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: items.length,
    upcoming: items.filter((a) => a.status === 'UPCOMING').length,
    featured: items.filter((a) => a.isFeatured).length,
    attendees: items.reduce((sum, a) => sum + a.attendeeCount, 0),
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
      <PageHeader
        icon={PartyPopper}
        title="กิจกรรม"
        subtitle="จัดการกิจกรรมองค์กรและช่องแสดงหน้า landing"
        actions={
          hasCreate && (
            <Button variant="create" size="lg" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
              <Plus />
              <span className="hidden sm:inline">สร้างกิจกรรม</span>
              <span className="sm:hidden">สร้าง</span>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div {...fadeUp(0.08)}>
          <StatCard icon={PartyPopper} label="ทั้งหมด" value={stats.total} gradient="from-violet-500 to-fuchsia-500" />
        </motion.div>
        <motion.div {...fadeUp(0.14)}>
          <StatCard icon={CalendarDays} label="เร็ว ๆ นี้" value={stats.upcoming} gradient="from-sky-500 to-indigo-500" />
        </motion.div>
        <motion.div {...fadeUp(0.20)}>
          <StatCard
            icon={Star}
            label={featuredSlots ? `หน้าบ้าน (${featuredSlots.max})` : 'หน้าบ้าน'}
            value={featuredSlots?.used ?? stats.featured}
            gradient="from-amber-500 to-orange-500"
          />
        </motion.div>
        <motion.div {...fadeUp(0.26)}>
          <StatCard icon={Users} label="ผู้เข้าร่วมรวม" value={stats.attendees} gradient="from-emerald-500 to-teal-500" />
        </motion.div>
      </div>

      <motion.div {...fadeUp(0.30)}>
        <TagPanel
          tags={tags}
          onChange={setTags}
          canManage={hasCreate || hasDelete}
        />
      </motion.div>

      <motion.div {...fadeUp(0.32)} className="flex flex-col gap-2.5">
        <div className="relative w-full sm:max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="ค้นหาชื่อ สถานที่…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-card/40 p-0.5">
            {(['All', ...ACTIVITY_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === s ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {statusFilter === s && (
                  <motion.span
                    layoutId="act-status-tab-bg"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {s === 'All' ? 'ทุกสถานะ' : s === 'UPCOMING' ? 'เร็ว ๆ นี้' : s === 'ONGOING' ? 'กำลังจัด' : 'จบแล้ว'}
              </button>
            ))}
          </div>

          {tags.length > 0 && (
            <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-card/40 p-0.5">
              <button
                onClick={() => setTagFilter('All')}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  tagFilter === 'All' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tagFilter === 'All' && (
                  <motion.span layoutId="act-tag-tab-bg" className="absolute inset-0 -z-10 rounded-md bg-accent/70" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                ทุกแท็ก
              </button>
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTagFilter(t.id)}
                  className={cn(
                    'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    tagFilter === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tagFilter === t.id && (
                    <motion.span layoutId="act-tag-tab-bg" className="absolute inset-0 -z-10 rounded-md bg-accent/70" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                  {t.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {([['All', 'ทั้งหมด'], ['active', 'เปิด'], ['inactive', 'ปิด']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setActiveFilter(val)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeFilter === val ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {activeFilter === val && (
                  <motion.span layoutId="act-active-tab-bg" className="absolute inset-0 -z-10 rounded-md bg-accent/70" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFeaturedOnly((v) => !v)}
            className={cn(
              'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              featuredOnly
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
            )}
          >
            <Star size={12} className={cn(featuredOnly && 'fill-amber-500')} />
            หน้าบ้าน
          </button>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.40)}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 pl-4 text-xs sm:pl-5">#</TableHead>
                    <TableHead className="text-xs">กิจกรรม</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">วันที่</TableHead>
                    <TableHead className="text-xs">สถานะ</TableHead>
                    <TableHead className="hidden text-xs md:table-cell">แท็ก</TableHead>
                    <TableHead className="hidden text-xs lg:table-cell">ผู้เข้าร่วม</TableHead>
                    <TableHead className="text-xs">เปิด/Featured</TableHead>
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
                            ไม่พบกิจกรรม
                          </td>
                        </tr>
                      )}
                      {paged.map((a, i) => (
                        <MotionTableRow
                          key={a.id}
                          className="group cursor-pointer"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04, ease: EASE }}
                          onClick={() => router.push(`/admin/activity/${a.id}`)}
                        >
                          <TableCell className="pl-4 text-xs text-muted-foreground sm:pl-5">
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
                                <AppIcon name={a.icon} className="size-4" />
                              </span>
                              <div className="min-w-0 max-w-xs">
                                <p className="flex items-center gap-1.5 truncate text-sm font-medium leading-tight">
                                  {a.isFeatured && <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" />}
                                  <span className="truncate">{a.name}</span>
                                </p>
                                <p className="truncate text-xs text-muted-foreground">{a.location ?? '—'}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {formatActivityDateRange(a.eventStartAt, a.eventEndAt)}
                            </span>
                          </TableCell>

                          <TableCell><StatusBadge status={a.status} /></TableCell>

                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {a.tags.length === 0 ? (
                                <span className="text-xs text-muted-foreground/60">—</span>
                              ) : (
                                a.tags.slice(0, 2).map((t) => <TagChip key={t.id} name={t.name} />)
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {a.attendeeCount}
                              {a.maxParticipants != null && ` / ${a.maxParticipants}`}
                            </span>
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {hasUpdate ? (
                                <>
                                  <ActiveToggle active={a.isActive} showLabel={false} onToggle={() => handleToggleActive(a)} />
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFeatured(a)}
                                    className={cn(
                                      'flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors',
                                      a.isFeatured
                                        ? 'bg-amber-500/15 text-amber-600'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                    title="สลับแสดงหน้าบ้าน"
                                  >
                                    <Star className={cn('h-3.5 w-3.5', a.isFeatured && 'fill-current')} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <FeaturedBadge featured={a.isFeatured} />
                                  <span className={cn('text-[10px] font-medium', a.isActive ? 'text-emerald-600' : 'text-muted-foreground')}>
                                    {a.isActive ? 'เปิด' : 'ปิด'}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="pr-3 sm:pr-4" onClick={(e) => e.stopPropagation()}>
                            <ActionMenu actions={[
                              { label: 'ดูรายละเอียด', icon: Eye, onClick: () => router.push(`/admin/activity/${a.id}`) },
                              ...(hasUpdate ? [{ label: 'แก้ไข', icon: Pencil, onClick: () => { setEditTarget(a); setModalOpen(true); } }] : []),
                              ...(hasDelete ? [{ label: 'ลบ', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(a) }] : []),
                            ]} />
                          </TableCell>
                        </MotionTableRow>
                      ))}
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
              layoutId="activity-page-active-bg"
              itemLabel="กิจกรรม"
            />
          </CardContent>
        </Card>
      </motion.div>

      <ActivityModal
        key={editTarget?.id ?? 'new'}
        open={modalOpen}
        activity={editTarget}
        featuredSlots={featuredSlots}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={(input, pendingFiles) =>
          editTarget
            ? handleUpdate(editTarget.id, input)
            : handleCreate(input, pendingFiles)
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบกิจกรรม"
        loading={deleting}
        message={
          <>
            ลบ <span className="font-semibold text-foreground">{deleteTarget?.name}</span> ออกจากระบบ?
            การกระทำนี้ไม่สามารถยกเลิกได้
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
