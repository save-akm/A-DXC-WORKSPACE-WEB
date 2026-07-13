'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Pencil, Trash2, Users, FolderOpen,
  Crown, Shield, CalendarDays, AlertCircle, Clock, Bell, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  fetchTeam, deleteTeam, updateTeam, uploadTeamLogo, deleteTeamLogo,
} from '@/lib/api/teams';
import { TeamModal, type LogoChange } from '../_components/team-modal';
import { TeamMembersModal } from '../_components/team-members-modal';
import type {
  TeamDetail, TeamMember, TeamProject, TeamUser, CreateTeamInput,
} from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
  'bg-cyan-600', 'bg-fuchsia-600',
];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const TAG_COLORS: Record<string, string> = {
  INFRA:    'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  DEVELOP:  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  AS400:    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  NEW_TECH: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  GENERAL:  'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  HELPDESK: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);

  // Members modal
  const [membersOpen, setMembersOpen] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTeam(id)
      .then(setTeam)
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        setFetchError(status === 404 ? 'ไม่พบทีมนี้' : 'โหลดข้อมูลไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleEditSubmit(input: CreateTeamInput, logoChange: LogoChange) {
    if (!team) return;
    try {
      const updated = await updateTeam(team.id, input);
      if (logoChange !== undefined) {
        if (logoChange === null) {
          if (updated.logoUrl) await deleteTeamLogo(updated.id);
          setTeam(prev => prev ? { ...prev, ...updated, logoUrl: null } : prev);
        } else {
          const file = new File([logoChange], 'logo.png', { type: logoChange.type });
          const withLogo = await uploadTeamLogo(updated.id, file);
          setTeam(prev => prev ? { ...prev, ...withLogo } : prev);
        }
      } else {
        setTeam(prev => prev ? { ...prev, ...updated } : prev);
      }
      toast.success('แก้ไขทีมสำเร็จ');
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  }

  async function handleDelete() {
    if (!team) return;
    setDeleting(true);
    try {
      await deleteTeam(team.id);
      toast.success(`ลบทีม "${team.name}" สำเร็จ`);
      router.push('/admin/teams');
    } catch {
      toast.error('ลบทีมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setDeleting(false);
    }
  }

  function handleMembersChange(teamId: string, members: TeamMember[]) {
    setTeam(prev => prev?.id === teamId ? { ...prev, members } : prev);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-5 h-8 w-32 animate-pulse rounded-xl bg-muted" />
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="h-24 w-full animate-pulse bg-muted" />
          <div className="px-6 pb-6 pt-14 space-y-3">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (fetchError || !team) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">{fetchError ?? 'ไม่พบทีมนี้'}</p>
        <Link
          href="/admin/teams"
          className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          กลับหน้าทีม
        </Link>
      </div>
    );
  }

  const { _viewer } = team;
  const logoInitial = team.name.charAt(0).toUpperCase();
  const leads = team.members.filter(m => m.roleInTeam === 'LEAD');
  const members = team.members.filter(m => m.roleInTeam === 'MEMBER');

  return (
    <div className="p-4 sm:p-6">

      {/* Back */}
      <Link
        href="/admin/teams"
        className="mb-5 inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        ทีมทั้งหมด
      </Link>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        {/* Banner */}
        <div className="relative h-24 bg-linear-to-br from-indigo-700 via-violet-700 to-violet-600">
          {/* Action buttons */}
          <div className="absolute right-4 top-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Users className="h-3.5 w-3.5" />
              จัดการสมาชิก
            </button>
            {_viewer.canEdit && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <Pencil className="h-3.5 w-3.5" />
                แก้ไข
              </button>
            )}
            {_viewer.canDelete && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500/30 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-red-500/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                ลบ
              </button>
            )}
          </div>

          {/* Logo */}
          <div className="absolute -bottom-14 left-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-[5px] border-card bg-linear-to-br from-indigo-700 via-violet-700 to-violet-600 shadow-2xl shadow-violet-900/40 ring-1 ring-white/10">
            {team.logoUrl && !logoError ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-full w-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-5xl font-extrabold text-white">{logoInitial}</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-5 pt-18">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">{team.name}</h1>
            {team.tags.map(tag => (
              <span
                key={tag}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${TAG_COLORS[tag] ?? 'bg-muted text-muted-foreground'}`}
              >
                {tag}
              </span>
            ))}
            {_viewer.roleInTeam && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                _viewer.roleInTeam === 'LEAD'
                  ? 'bg-amber-400/20 text-amber-700 dark:text-amber-400'
                  : 'bg-indigo-400/15 text-indigo-700 dark:text-indigo-400'
              }`}>
                {_viewer.roleInTeam === 'LEAD' ? '★ LEAD' : 'MEMBER'}
              </span>
            )}
          </div>
          {team.description && (
            <p className="mt-1.5 text-[13px] text-muted-foreground">{team.description}</p>
          )}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {team.members.length} สมาชิก
            </span>
            <span className="flex items-center gap-1">
              <FolderOpen className="h-3.5 w-3.5" />
              {team._count.projects} projects
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              สร้าง {formatDate(team.createdAt)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Body grid */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[3fr_7fr]">

        {/* Members */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="h-fit self-start overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[12px] font-bold text-foreground">
                LEAD <span className="ml-1 text-muted-foreground font-normal">({leads.length})</span>
              </span>
            </div>
          </div>
          <MemberList members={leads} />

          <div className="flex items-center gap-2 border-b border-t border-border/60 px-5 py-3.5">
            <Shield className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-[12px] font-bold text-foreground">
              MEMBER <span className="ml-1 text-muted-foreground font-normal">({members.length})</span>
            </span>
          </div>
          <MemberList members={members} />
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="h-fit self-start overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3.5">
            <FolderOpen className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-[12px] font-bold text-foreground">
              Projects <span className="ml-1 text-muted-foreground font-normal">({team.projects.length})</span>
            </span>
          </div>
          <ProjectList projects={team.projects} />
        </motion.div>
      </div>

      {/* Edit modal */}
      <TeamModal
        open={editOpen}
        team={team}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Members modal */}
      <TeamMembersModal
        open={membersOpen}
        team={team}
        canManage={_viewer.canEdit}
        onClose={() => setMembersOpen(false)}
        onMembersChange={handleMembersChange}
      />

      {/* Delete confirm */}
      {deleteOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl">
              <div className="h-1 w-full bg-linear-to-r from-rose-500 to-red-600" />
              <div className="px-6 py-5">
                <div className="mb-1 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <h2 className="text-[14px] font-bold">ลบทีม</h2>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  ต้องการลบทีม{' '}
                  <span className="font-semibold text-foreground">"{team.name}"</span>{' '}
                  ใช่ไหม? การกระทำนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
              <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteOpen(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-destructive/90 disabled:opacity-60"
                >
                  {deleting ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  ลบทีม
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MemberList({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="px-5 py-6 text-center text-[12px] text-muted-foreground">ไม่มี</div>
    );
  }
  return (
    <div className="divide-y divide-border/50">
      {members.map(m => (
        <div key={m.id} className="flex items-center gap-3 px-5 py-2.5">
          <UserAvatar
            initial={`${m.user.firstName.charAt(0)}${m.user.lastName.charAt(0)}`}
            color={avatarColor(m.userId)}
            avatarUrl={m.user.avatarUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">
              {m.user.firstName} {m.user.lastName}
              {m.user.nickname && (
                <span className="ml-1 text-[11px] text-muted-foreground">({m.user.nickname})</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── status chip ───────────────────────────────────────────────────────────────

interface StatusStyle {
  dot: string;
  chip: string;
  label: string;
}

// Workflow order: U0 (not started) → J1…J5 (phases) → P0 (production / live)
const STATUS_ORDER = ['U0', 'J1', 'J2', 'J3', 'J4', 'J5', 'P0'];

const STATUS_STYLES: Record<string, StatusStyle> = {
  U0: { dot: 'bg-slate-400',   chip: 'border-slate-400/40 bg-slate-400/10 text-slate-500 dark:text-slate-400',         label: 'U0' },
  J1: { dot: 'bg-sky-500',     chip: 'border-sky-400/40 bg-sky-400/10 text-sky-600 dark:text-sky-400',                 label: 'J1' },
  J2: { dot: 'bg-indigo-500',  chip: 'border-indigo-400/40 bg-indigo-400/10 text-indigo-600 dark:text-indigo-400',     label: 'J2' },
  J3: { dot: 'bg-violet-500',  chip: 'border-violet-400/40 bg-violet-400/10 text-violet-600 dark:text-violet-400',     label: 'J3' },
  J4: { dot: 'bg-amber-500',   chip: 'border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400',         label: 'J4' },
  J5: { dot: 'bg-lime-500',    chip: 'border-lime-400/40 bg-lime-400/10 text-lime-600 dark:text-lime-400',             label: 'J5' },
  P0: { dot: 'bg-emerald-500', chip: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400', label: 'P0 · LIVE' },
};

function getStatus(code: string): StatusStyle {
  return STATUS_STYLES[code] ?? {
    dot: 'bg-muted-foreground/50',
    chip: 'border-border bg-muted text-muted-foreground',
    label: code,
  };
}

// ── progress helper — derived from workflow phase ───────────────────────────────

function computeProgress(p: TeamProject): number | null {
  const idx = STATUS_ORDER.indexOf(p.statusCode);
  if (idx < 0) return null;
  return Math.round((idx / (STATUS_ORDER.length - 1)) * 100);
}

// ── cost formatter ──────────────────────────────────────────────────────────────

function formatCost(amount: string | null, currency: string | null): string | null {
  if (!amount) return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return null;
  const formatted = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(num);
  return currency === 'THB' ? `฿${formatted}` : `${formatted} ${currency ?? ''}`.trim();
}

type DueSeverity = 'done' | 'normal' | 'warning' | 'urgent';

function dueLabel(p: TeamProject): { label: string; severity: DueSeverity } | null {
  if (p.actualEndDate) return { label: 'เสร็จแล้ว', severity: 'done' };
  if (!p.plannedEndDate) return null;
  const days = Math.ceil((new Date(p.plannedEndDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0)  return { label: `เกินกำหนด ${Math.abs(days)} วัน`, severity: 'urgent' };
  if (days === 0) return { label: 'ครบกำหนดวันนี้', severity: 'urgent' };
  if (days <= 7) return { label: `Due in ${days} วัน`, severity: 'warning' };
  return { label: `Due in ${days} วัน`, severity: 'normal' };
}

// ── ProjectList ───────────────────────────────────────────────────────────────

function ProjectList({ projects }: { projects: TeamProject[] }) {
  if (projects.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[12px] text-muted-foreground">ยังไม่มี project</div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start divide-y divide-border/50 xl:grid-cols-2 xl:divide-y-0">
      {projects.map(p => {
        const progress = computeProgress(p);
        const due = dueLabel(p);

        // Assignees = lead + owner + contributors, deduplicated by user id
        const assignees: TeamUser[] = [];
        const seen = new Set<string>();
        for (const u of [p.lead, p.owner, ...(p.contributors ?? []).map(c => c.user)]) {
          if (u && !seen.has(u.id)) { seen.add(u.id); assignees.push(u); }
        }

        const cost = formatCost(p.costAmount, p.costCurrency);
        const st = getStatus(p.statusCode);

        return (
          <div key={p.id} className="h-fit space-y-2 self-start border-border/50 px-5 py-4 xl:border-b xl:[&:nth-child(odd)]:border-r">

            {/* Row 1: name + shortName */}
            <p className="truncate text-[14px] font-semibold leading-snug text-foreground">
              {p.name}
              {p.shortName && (
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">({p.shortName})</span>
              )}
            </p>

            {/* Row 2: description */}
            {p.description && (
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            )}

            {/* Row 3: meta chips */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {p.category}
              </span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                KI {p.kiYear}
              </span>
              {p.quarter && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {p.quarter}
                </span>
              )}
              {cost && (
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {cost}
                </span>
              )}
            </div>

            {/* Row 3: date range (left) + status chip (right) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(p.startDate)}</span>
                {p.plannedEndDate && (
                  <>
                    <span className="mx-0.5 opacity-40">→</span>
                    <span>{formatDate(p.plannedEndDate)}</span>
                  </>
                )}
              </div>
              <span className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${st.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>

            {/* Row 4: inline progress + due */}
            {(progress != null || due) && (
              <div className="flex items-center gap-2">
                {progress != null && (
                  <>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      PROGRESS
                    </span>
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[12px] font-bold tabular-nums text-foreground">
                      {progress}%
                    </span>
                  </>
                )}

                {due && due.severity === 'normal' && (
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {due.label}
                  </span>
                )}
                {due && due.severity === 'done' && (
                  <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                    <Clock className="h-3.5 w-3.5" />
                    {due.label}
                  </span>
                )}
                {due && due.severity === 'warning' && (
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    {due.label}
                  </span>
                )}
                {due && due.severity === 'urgent' && (
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive">
                    <motion.span
                      animate={{ rotate: [0, -18, 18, -12, 12, -6, 6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, repeatDelay: 2 }}
                      className="inline-flex"
                    >
                      <Bell className="h-4 w-4" />
                    </motion.span>
                    {due.label}
                  </span>
                )}
              </div>
            )}

            {/* Row 5: assignees — below progress */}
            {assignees.length > 0 && (
              <div className="flex h-6 items-center gap-1.5">
                <div className="flex">
                  {assignees.map((u, i) => (
                    <div key={u.id} className={i > 0 ? '-ml-1.5' : ''}>
                      <UserAvatar
                        initial={`${u.firstName.charAt(0)}${u.lastName.charAt(0)}`}
                        color={avatarColor(u.id)}
                        avatarUrl={u.avatarUrl}
                        size="xs"
                        className="rounded-full ring-2 ring-card"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {assignees.length} members
                </span>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
