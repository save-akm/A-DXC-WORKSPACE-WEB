'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  ImageIcon,
  MapPin,
  CalendarDays,
  UserMinus,
} from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import {
  fetchAdminActivity,
  fetchActivityAttendees,
  updateActivity,
  deleteActivity,
  removeActivityAttendee,
  fetchFeaturedSlots,
} from '@/lib/api/activity';
import type {
  ActivityAttendee,
  ActivityDetail,
  CreateActivityInput,
  FeaturedSlots,
} from '@/lib/activity/types';
import { StatusBadge, FeaturedBadge, TagChip, humanizeActivityError } from '../_components/activity-meta';
import { ActivityModal } from '../_components/activity-modal';
import { ActivityImageGallery } from '../_components/activity-image-gallery';
import { InvitationHistorySection } from '../_components/invitation-history-section';
import { InvitationWizard } from '../_components/invitation-wizard';
import { ConfirmDialog } from '@/components/management/confirm-dialog';

import { formatActivityDateRangeDetail } from '@/lib/activity/format';

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function displayName(u: { firstName: string; lastName: string; nickname: string | null }) {
  return u.nickname?.trim() || `${u.firstName} ${u.lastName}`.trim();
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('activity');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  const hasView = noNode || canView;
  const hasUpdate = noNode || canUpdate;
  const hasDelete = noNode || canDelete;

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [attendees, setAttendees] = useState<ActivityAttendee[]>([]);
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlots | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRefresh, setInviteRefresh] = useState(0);

  const load = useCallback(async () => {
    try {
      const [detail, list, slots] = await Promise.all([
        fetchAdminActivity(id),
        fetchActivityAttendees(id),
        fetchFeaturedSlots(),
      ]);
      setActivity(detail);
      setAttendees(list);
      setFeaturedSlots(slots);
      setFetchError(null);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      setFetchError(status === 404 ? 'ไม่พบกิจกรรมนี้' : humanizeActivityError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleEdit(input: CreateActivityInput) {
    if (!activity) return;
    const updated = await updateActivity(activity.id, input);
    setActivity(updated);
    const slots = await fetchFeaturedSlots();
    setFeaturedSlots(slots);
    toast.success('บันทึกการแก้ไขสำเร็จ');
  }

  async function handleDelete() {
    if (!activity) return;
    setDeleting(true);
    try {
      await deleteActivity(activity.id);
      toast.success('ลบกิจกรรมสำเร็จ');
      router.push('/admin/activity');
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setDeleting(false);
    }
  }

  async function handleRemoveAttendee() {
    if (!activity || !removeUserId) return;
    setRemovingUser(true);
    try {
      await removeActivityAttendee(activity.id, removeUserId);
      setAttendees((prev) => prev.filter((a) => a.user.id !== removeUserId));
      setActivity((prev) =>
        prev ? { ...prev, attendeeCount: Math.max(0, prev.attendeeCount - 1) } : prev,
      );
      toast.success('นำผู้เข้าร่วมออกสำเร็จ');
      setRemoveUserId(null);
    } catch (err) {
      toast.error(humanizeActivityError(err));
    } finally {
      setRemovingUser(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (fetchError || !activity) {
    return (
      <div className="page-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">{fetchError ?? 'ไม่พบกิจกรรม'}</p>
        <Link href="/admin/activity" className="text-sm font-semibold text-brand hover:underline">
          กลับไปรายการกิจกรรม
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* Back */}
      <Link
        href="/admin/activity"
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
              <AppIcon name={activity.icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={activity.status} />
                <FeaturedBadge featured={activity.isFeatured} />
              </div>
              <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{activity.name}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasUpdate && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
                แก้ไข
              </Button>
            )}
            {hasDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                ลบ
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {activity.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{activity.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-violet-500" />
                {formatActivityDateRangeDetail(activity.eventStartAt, activity.eventEndAt)}
              </span>
              {activity.location && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  {activity.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 text-violet-500" />
                {activity.attendeeCount}
                {activity.maxParticipants != null && ` / ${activity.maxParticipants}`} คน
              </span>
            </div>

            {activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activity.tags.map((t) => <TagChip key={t.id} name={t.name} />)}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">สร้างโดย</p>
            {activity.createdBy ? (
              <p className="font-medium">{displayName(activity.createdBy)}</p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {activity.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              {featuredSlots && activity.isFeatured && (
                <> · ช่องหน้าบ้าน {featuredSlots.used}/{featuredSlots.max}</>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Gallery */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-bold">รูปภาพกิจกรรม</h2>
          <span className="text-xs text-muted-foreground">({activity.images.length})</span>
        </div>

        {hasUpdate && (
          <ActivityImageGallery
            activity={activity}
            canManage={hasUpdate}
            onUpdated={setActivity}
          />
        )}

        {!hasUpdate && activity.images.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีรูปภาพ
          </p>
        )}

        {!hasUpdate && activity.images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[...activity.images]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((img) => (
                <div key={img.id} className="overflow-hidden rounded-xl border border-border/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageUrl} alt={img.caption ?? ''} className="aspect-4/3 w-full object-cover" />
                </div>
              ))}
          </div>
        )}
      </motion.section>

      {/* Attendees */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-bold">ผู้เข้าร่วม</h2>
          <span className="text-xs text-muted-foreground">({attendees.length})</span>
        </div>

        {attendees.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีผู้เข้าร่วม
          </p>
        ) : (
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
            {attendees.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-card/40 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    avatarUrl={a.user.avatarUrl}
                    initial={`${a.user.firstName.charAt(0)}${a.user.lastName.charAt(0)}`}
                    color={avatarColor(a.user.id)}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{displayName(a.user)}</p>
                    <p className="text-xs text-muted-foreground">{a.user.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {new Date(a.joinedAt).toLocaleDateString('th-TH')}
                  </span>
                  {hasUpdate && (
                    <button
                      type="button"
                      onClick={() => setRemoveUserId(a.user.id)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="นำออก"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Invitations history — VIEW permission */}
      {hasView && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <InvitationHistorySection
            activityId={activity.id}
            canSend={hasUpdate}
            onSendClick={() => setInviteOpen(true)}
            refreshToken={inviteRefresh}
          />
        </motion.section>
      )}

      <InvitationWizard
        open={inviteOpen}
        activityId={activity.id}
        activityName={activity.name}
        onClose={() => setInviteOpen(false)}
        onSent={() => setInviteRefresh((k) => k + 1)}
      />

      <ActivityModal
        key={activity.id}
        open={editOpen}
        activity={activity}
        featuredSlots={featuredSlots}
        onClose={() => setEditOpen(false)}
        onSubmit={(input, _files) => handleEdit(input)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="ลบกิจกรรม"
        loading={deleting}
        message={<>ลบ <span className="font-semibold text-foreground">{activity.name}</span> ออกจากระบบ?</>}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={removeUserId !== null}
        title="นำผู้เข้าร่วมออก"
        confirmLabel="นำออก"
        loading={removingUser}
        message="นำผู้ใช้นี้ออกจากรายชื่อผู้เข้าร่วม?"
        onConfirm={handleRemoveAttendee}
        onCancel={() => setRemoveUserId(null)}
      />
    </div>
  );
}
