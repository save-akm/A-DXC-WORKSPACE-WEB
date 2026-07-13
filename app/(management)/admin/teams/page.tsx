'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Users, FolderOpen, BarChart3, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { StatCard } from '@/components/management/stat-card';
import { useAuthStore } from '@/lib/store';
import { useMenuStore } from '@/lib/stores/menu-store';
import type { MenuNode } from '@/lib/auth/types';
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  uploadTeamLogo,
  deleteTeamLogo,
} from '@/lib/api/teams';
import { TeamCard } from './_components/team-card';
import { TeamCardSkeleton } from './_components/team-card-skeleton';
import { TeamModal, type LogoChange } from './_components/team-modal';
import { TeamMembersModal } from './_components/team-members-modal';
import type { Team, CreateTeamInput, TeamMember, TeamTag } from './types';

function findMenuByPath(nodes: MenuNode[], path: string): MenuNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    const found = findMenuByPath(node.children, path);
    if (found) return found;
  }
}

export default function TeamsPage() {
  const currentUserId = useAuthStore(s => s.user?.id ?? '');
  const menus = useMenuStore(s => s.menus);
  const teamsMenu = useMemo(() => findMenuByPath(menus, '/admin/teams'), [menus]);
  const canCreate = teamsMenu?.permissions.includes('CREATE') ?? false;
  const canDeleteAny = teamsMenu?.permissions.includes('DELETE') ?? false;

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<TeamTag | ''>('');

  // Create / edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Members modal
  const [memberTeam, setMemberTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูลทีมได้'))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const allTags = useMemo(() => {
    const set = new Set<TeamTag>();
    for (const t of teams) for (const tag of t.tags) set.add(tag);
    return Array.from(set).sort();
  }, [teams]);

  const totalMembers = useMemo(() => teams.reduce((s, t) => s + t.members.length, 0), [teams]);
  const totalProjects = useMemo(() => teams.reduce((s, t) => s + t._count.projects, 0), [teams]);

  const filtered = useMemo(() => {
    let result = teams;
    if (tagFilter) result = result.filter(t => t.tags.includes(tagFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [teams, search, tagFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => { setEditTarget(null); setModalOpen(true); }, []);
  const openEdit = useCallback((team: Team) => { setEditTarget(team); setModalOpen(true); }, []);
  const openMembers = useCallback((team: Team) => setMemberTeam(team), []);

  const handleSubmit = useCallback(async (input: CreateTeamInput, logoChange: LogoChange) => {
    try {
      let team: Team;
      if (editTarget) {
        team = await updateTeam(editTarget.id, input);
        setTeams(prev => prev.map(t => (t.id === team.id ? team : t)));
        toast.success('แก้ไขทีมสำเร็จ');
      } else {
        team = await createTeam(input);
        setTeams(prev => [...prev, team]);
        toast.success(`สร้างทีม "${team.name}" สำเร็จ`);
      }

      // Handle logo change after team is saved
      if (logoChange !== undefined) {
        if (logoChange === null) {
          if (team.logoUrl) {
            await deleteTeamLogo(team.id);
            setTeams(prev => prev.map(t => t.id === team.id ? { ...t, logoUrl: null } : t));
          }
        } else {
          const file = new File([logoChange], 'logo.png', { type: logoChange.type });
          const updated = await uploadTeamLogo(team.id, file);
          setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
      }
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  }, [editTarget]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTeam(deleteTarget.id);
      setTeams(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast.success(`ลบทีม "${deleteTarget.name}" สำเร็จ`);
      setDeleteTarget(null);
    } catch {
      toast.error('ลบทีมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const handleMembersChange = useCallback((teamId: string, members: TeamMember[]) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, members } : t));
    // Keep memberTeam in sync so the modal reflects latest data
    setMemberTeam(prev => prev?.id === teamId ? { ...prev, members } : prev);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6">

      {/* Page header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">Teams</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">จัดการทีมและสมาชิกในระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาทีม…"
              className="w-40 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none sm:w-52"
            />
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-shadow hover:shadow-indigo-500/50"
            >
              <Plus className="h-3.5 w-3.5" />
              สร้างทีม
            </button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTagFilter('')}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              !tagFilter
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            ทั้งหมด
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                tagFilter === tag
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Users} label="ทีมทั้งหมด" value={teams.length} gradient="from-indigo-500 to-violet-500" />
        <StatCard icon={BarChart3} label="สมาชิกรวม" value={totalMembers} gradient="from-teal-500 to-cyan-500" />
        <StatCard icon={FolderOpen} label="Projects" value={totalProjects} gradient="from-violet-500 to-fuchsia-500" />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <TeamCardSkeleton key={i} />)}
        </div>
      )}

      {/* Card grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((team, i) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <TeamCard
                  team={team}
                  currentUserId={currentUserId}
                  canDeleteAny={canDeleteAny}
                  onEdit={openEdit}
                  onDelete={t => setDeleteTarget(t)}
                  onManageMembers={openMembers}
                />
              </motion.div>
            ))}

            {/* Add placeholder — only for users who can create, hide during search / filter */}
            {canCreate && !search && !tagFilter && (
              <motion.button
                key="add-card"
                type="button"
                layout
                onClick={openCreate}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: filtered.length * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-50 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-border bg-muted">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-[12px] font-semibold">สร้างทีมใหม่</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {filtered.length === 0 && (search || tagFilter) && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
              {search
                ? `ไม่พบทีมที่ตรงกับ "${search}"`
                : `ไม่มีทีมที่มี tag "${tagFilter}"`}
            </div>
          )}
        </div>
      )}

      {/* Create / edit modal */}
      <TeamModal
        open={modalOpen}
        team={editTarget}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Members modal */}
      <TeamMembersModal
        open={memberTeam !== null}
        team={memberTeam}
        canManage={memberTeam?.members.some(m => m.userId === currentUserId && m.roleInTeam === 'LEAD') ?? false}
        onClose={() => setMemberTeam(null)}
        onMembersChange={handleMembersChange}
      />

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              key="del-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                key="del-modal"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="h-1 w-full bg-linear-to-r from-rose-500 to-red-600" />
                <div className="px-6 py-5">
                  <div className="mb-1 flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <h2 className="text-[14px] font-bold">ลบทีม</h2>
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    ต้องการลบทีม{' '}
                    <span className="font-semibold text-foreground">"{deleteTarget.name}"</span>{' '}
                    ใช่ไหม? การกระทำนี้ไม่สามารถยกเลิกได้
                  </p>
                </div>
                <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังลบ…
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        ลบทีม
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
