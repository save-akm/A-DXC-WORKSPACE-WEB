'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Users, FolderOpen, BarChart3, Plus } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { StatCard } from '@/components/management/stat-card';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '@/lib/api/teams';
import { TeamCard } from './_components/team-card';
import { TeamCardSkeleton } from './_components/team-card-skeleton';
import { TeamDrawer } from './_components/team-drawer';
import type { Team, CreateTeamInput } from './types';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูลทีมได้'))
      .finally(() => setLoading(false));
  }, []);

  const totalMembers = useMemo(
    () => teams.reduce((s, t) => s + t.members.length, 0),
    [teams],
  );
  const totalProjects = useMemo(
    () => teams.reduce((s, t) => s + t._count.projects, 0),
    [teams],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [teams, search]);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((team: Team) => {
    setEditTarget(team);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(async (team: Team) => {
    if (!window.confirm(`ต้องการลบทีม "${team.name}" ใช่ไหม?`)) return;
    try {
      await deleteTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      toast.success(`ลบทีม "${team.name}" สำเร็จ`);
    } catch {
      toast.error('ลบทีมไม่สำเร็จ กรุณาลองใหม่');
    }
  }, []);

  const handleSubmit = useCallback(
    async (input: CreateTeamInput) => {
      try {
        if (editTarget) {
          const updated = await updateTeam(editTarget.id, input);
          setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          toast.success('แก้ไขทีมสำเร็จ');
        } else {
          const created = await createTeam(input);
          setTeams((prev) => [...prev, created]);
          toast.success(`สร้างทีม "${created.name}" สำเร็จ`);
        }
      } catch {
        toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
      }
    },
    [editTarget],
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Teams
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">จัดการทีมและสมาชิกในระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาทีม…"
              className="w-40 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none sm:w-52"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            สร้างทีม
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Users} label="ทีมทั้งหมด" value={teams.length} gradient="from-indigo-500 to-violet-500" />
        <StatCard icon={BarChart3} label="สมาชิกรวม" value={totalMembers} gradient="from-teal-500 to-cyan-500" />
        <StatCard icon={FolderOpen} label="Projects" value={totalProjects} gradient="from-violet-500 to-fuchsia-500" />
      </div>

      {/* Loading skeleton grid */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Card grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  index={i}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}

            {/* Add team placeholder card — hide during search */}
            {!search && <motion.button
              key="add-card"
              type="button"
              layout
              onClick={openCreate}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: filtered.length * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-50 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground cursor-pointer"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-border bg-muted">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-[12px] font-semibold">สร้างทีมใหม่</span>
            </motion.button>}
          </AnimatePresence>

          {/* Empty search state */}
          {filtered.length === 0 && search && (
            <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
              ไม่พบทีมที่ตรงกับ &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}

      <TeamDrawer
        open={drawerOpen}
        team={editTarget}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
