'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, UserPlus, Search, Crown, Shield, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { addMember, updateMemberRole, removeMember } from '@/lib/api/teams';
import { fetchAllUsers } from '@/lib/api/users';
import type { Team, TeamMember } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AvailableUser {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
}

interface TeamMembersModalProps {
  open: boolean;
  team: Team | null;
  canManage: boolean;
  onClose: () => void;
  onMembersChange: (teamId: string, members: TeamMember[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
  'bg-cyan-600', 'bg-fuchsia-600',
];

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function displayName(u: { firstName: string; lastName: string; nickname: string | null }) {
  const nick = u.nickname ? ` (${u.nickname})` : '';
  return `${u.firstName} ${u.lastName}${nick}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TeamMembersModal({ open, team, canManage, onClose, onMembersChange }: TeamMembersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState<AvailableUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const usersLoaded = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Reset state when team changes or modal opens
  useEffect(() => {
    if (open && team) {
      setMembers([...team.members].sort((a, b) =>
        a.roleInTeam === 'LEAD' ? -1 : b.roleInTeam === 'LEAD' ? 1 : 0,
      ));
      setAddMode(false);
      setQuery('');
    }
  }, [open, team]);

  // Lazy-load all users once
  const loadUsers = useCallback(async () => {
    if (usersLoaded.current) return;
    setUsersLoading(true);
    try {
      const users = await fetchAllUsers();
      setAllUsers(users.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        nickname: u.nickname ?? null,
        avatarUrl: u.avatarUrl ?? null,
      })));
      usersLoaded.current = true;
    } finally {
      setUsersLoading(false);
    }
  }, []);

  function openAddMode() {
    setAddMode(true);
    setQuery('');
    loadUsers();
  }

  // Users not already in team, filtered by query
  const availableUsers = allUsers.filter(u => {
    const isMember = members.some(m => m.userId === u.id);
    if (isMember) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      (u.nickname?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleAdd(user: AvailableUser, role: 'LEAD' | 'MEMBER') {
    if (!team) return;
    setPendingAdd(user.id);
    try {
      const newMember = await addMember(team.id, { userId: user.id, roleInTeam: role });
      const updated = [...members, newMember].sort((a, b) =>
        a.roleInTeam === 'LEAD' ? -1 : b.roleInTeam === 'LEAD' ? 1 : 0,
      );
      setMembers(updated);
      onMembersChange(team.id, updated);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('INVALID_LEAD_ROLE')) {
        toast.error('ผู้ใช้นี้ไม่ใช่ ADMIN ไม่สามารถแต่งตั้งเป็น LEAD ได้');
      } else if (msg.includes('ALREADY_MEMBER')) {
        toast.error('ผู้ใช้นี้เป็นสมาชิกของทีมอยู่แล้ว');
      } else {
        toast.error('เพิ่มสมาชิกไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setPendingAdd(null);
    }
  }

  async function handleChangeRole(member: TeamMember, newRole: 'LEAD' | 'MEMBER') {
    if (!team) return;
    setPendingRole(member.userId);
    try {
      const updated = await updateMemberRole(team.id, member.userId, { roleInTeam: newRole });
      const next = members
        .map(m => (m.userId === member.userId ? updated : m))
        .sort((a, b) => (a.roleInTeam === 'LEAD' ? -1 : b.roleInTeam === 'LEAD' ? 1 : 0));
      setMembers(next);
      onMembersChange(team.id, next);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('INVALID_LEAD_ROLE')) {
        toast.error('ผู้ใช้นี้ไม่ใช่ ADMIN ไม่สามารถเปลี่ยนเป็น LEAD ได้');
      } else {
        toast.error('เปลี่ยน role ไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setPendingRole(null);
    }
  }

  async function handleRemove(member: TeamMember) {
    if (!team) return;
    setPendingRemove(member.userId);
    try {
      await removeMember(team.id, member.userId);
      const next = members.filter(m => m.userId !== member.userId);
      setMembers(next);
      onMembersChange(team.id, next);
    } catch {
      toast.error('ลบสมาชิกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setPendingRemove(null);
    }
  }

  const modal = (
    <AnimatePresence>
      {open && team && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* Accent bar */}
              <div className="h-1 w-full shrink-0 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">สมาชิกทีม</h2>
                    <p className="text-[11px] text-muted-foreground">{team.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">

                {/* Add member section */}
                <AnimatePresence initial={false}>
                  {addMode && (
                    <motion.div
                      key="add-section"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
                        {/* Search */}
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <input
                              autoFocus
                              type="text"
                              value={query}
                              onChange={e => setQuery(e.target.value)}
                              placeholder="ค้นหาผู้ใช้…"
                              className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => { setAddMode(false); setQuery(''); }}
                            className="shrink-0 cursor-pointer rounded-xl border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                          >
                            ยกเลิก
                          </button>
                        </div>

                        {/* Available users list */}
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-background">
                          {usersLoading && (
                            <div className="flex items-center justify-center py-8">
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-indigo-500" />
                            </div>
                          )}
                          {!usersLoading && availableUsers.length === 0 && (
                            <p className="py-6 text-center text-[12px] text-muted-foreground">
                              {query ? `ไม่พบ "${query}"` : 'ไม่มีผู้ใช้ที่เพิ่มได้'}
                            </p>
                          )}
                          {!usersLoading && availableUsers.map(user => {
                            const loading = pendingAdd === user.id;
                            return (
                              <div
                                key={user.id}
                                className="flex items-center gap-3 border-b border-border/50 px-3 py-2.5 last:border-0"
                              >
                                <UserAvatar
                                  initial={user.firstName.charAt(0)}
                                  color={avatarColor(user.id)}
                                  avatarUrl={user.avatarUrl}
                                  size="xs"
                                />
                                <span className="flex-1 truncate text-[12px] font-medium text-foreground">
                                  {displayName(user)}
                                </span>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleAdd(user, 'LEAD')}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
                                  >
                                    {loading ? <span className="h-3 w-3 animate-spin rounded-full border border-amber-600/30 border-t-amber-600" /> : <Crown className="h-3 w-3" />}
                                    LEAD
                                  </button>
                                  <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleAdd(user, 'MEMBER')}
                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-500/20 disabled:opacity-50 dark:text-indigo-400"
                                  >
                                    {loading ? <span className="h-3 w-3 animate-spin rounded-full border border-indigo-600/30 border-t-indigo-600" /> : <Shield className="h-3 w-3" />}
                                    MEMBER
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Members list header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    สมาชิก ({members.length})
                  </span>
                  {canManage && !addMode && (
                    <button
                      type="button"
                      onClick={openAddMode}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:text-indigo-400"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      เพิ่มสมาชิก
                    </button>
                  )}
                </div>

                {/* Members */}
                <div className="px-5 pb-4">
                  {members.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border py-10 text-center text-[12px] text-muted-foreground">
                      ยังไม่มีสมาชิก
                    </div>
                  )}
                  <div className="space-y-1">
                    {members.map(member => {
                      const isLead = member.roleInTeam === 'LEAD';
                      const loadingRole = pendingRole === member.userId;
                      const loadingRemove = pendingRemove === member.userId;
                      const busy = loadingRole || loadingRemove;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          <UserAvatar
                            initial={`${member.user.firstName.charAt(0)}${member.user.lastName.charAt(0)}`}
                            color={avatarColor(member.userId)}
                            avatarUrl={member.user.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-foreground">
                              {displayName(member.user)}
                            </p>
                          </div>

                          {/* Role badge / toggle */}
                          {loadingRole ? (
                            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-indigo-500" />
                          ) : canManage ? (
                            <Tooltip>
                              <TooltipTrigger
                                disabled={busy}
                                onClick={() => handleChangeRole(member, isLead ? 'MEMBER' : 'LEAD')}
                                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm transition-all disabled:opacity-40 ${
                                  isLead
                                    ? 'border-amber-400/60 bg-linear-to-r from-amber-400/25 to-orange-400/20 text-amber-700 shadow-amber-400/25 hover:border-amber-400/80 hover:from-amber-400/35 hover:to-orange-400/30 dark:border-amber-400/50 dark:from-amber-400/20 dark:to-orange-400/15 dark:text-amber-300'
                                    : 'border-indigo-400/40 bg-linear-to-r from-indigo-400/10 to-violet-400/10 text-indigo-600 hover:border-indigo-400/60 hover:from-indigo-400/20 hover:to-violet-400/15 dark:border-indigo-400/35 dark:text-indigo-400'
                                }`}
                              >
                                {isLead ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                {isLead ? 'LEAD' : 'MEMBER'}
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {isLead ? 'เปลี่ยนเป็น MEMBER' : 'เปลี่ยนเป็น LEAD'}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              isLead
                                ? 'border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300'
                                : 'border-indigo-400/30 bg-indigo-400/8 text-indigo-600 dark:text-indigo-400'
                            }`}>
                              {isLead ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                              {isLead ? 'LEAD' : 'MEMBER'}
                            </span>
                          )}

                          {/* Remove button — LEAD only */}
                          {canManage && (
                            loadingRemove ? (
                              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-destructive" />
                            ) : (
                              <Tooltip>
                                <TooltipTrigger
                                  disabled={busy}
                                  onClick={() => handleRemove(member)}
                                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </TooltipTrigger>
                                <TooltipContent side="top">ลบออกจากทีม</TooltipContent>
                              </Tooltip>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-border/60 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
