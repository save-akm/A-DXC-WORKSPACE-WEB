'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, FolderOpen, Users } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ActionMenu } from '@/components/management/action-menu';
import type { Team } from '../types';

const TAG_COLORS: string[] = [
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
];

const AVATAR_COLORS: string[] = [
  'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
  'bg-cyan-600', 'bg-fuchsia-600',
];

function tagColorClass(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface TeamCardProps {
  team: Team;
  currentUserId: string;
  canDeleteAny: boolean;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onManageMembers: (team: Team) => void;
}

export function TeamCard({ team, currentUserId, canDeleteAny, onEdit, onDelete, onManageMembers }: TeamCardProps) {
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  const isLead = team.members.some(m => m.userId === currentUserId && m.roleInTeam === 'LEAD');

  const sorted = [...team.members].sort((a, b) =>
    a.roleInTeam === 'LEAD' ? -1 : b.roleInTeam === 'LEAD' ? 1 : 0,
  );
  const shown = sorted.slice(0, 3);
  const overflow = team.members.length - shown.length;
  const logoInitial = team.name.charAt(0).toUpperCase();

  const menuActions = [
    ...(isLead ? [{ icon: Users, label: 'จัดการสมาชิก', onClick: () => onManageMembers(team) }] : []),
    ...(isLead ? [{ icon: Pencil, label: 'แก้ไขทีม', onClick: () => onEdit(team) }] : []),
    ...(canDeleteAny ? [{ icon: Trash2, label: 'ลบทีม', destructive: true as const, onClick: () => onDelete(team) }] : []),
  ];

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-violet-500/30 hover:shadow-xl"
      onClick={() => router.push(`/admin/teams/${team.id}`)}
    >
        {/* Banner */}
        <div className="relative h-16 shrink-0 bg-linear-to-br from-indigo-700 via-violet-700 to-violet-600">
          {menuActions.length > 0 && (
            <div className="absolute right-2 top-2">
              <ActionMenu
                triggerSize="icon-sm"
                triggerClassName="text-white hover:bg-white/15"
                actions={menuActions}
              />
            </div>
          )}
          {/* Logo */}
          <div className="absolute -bottom-12 left-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-linear-to-br from-indigo-700 via-violet-700 to-violet-600 shadow-xl shadow-black/20">
            {team.logoUrl && !logoError ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-full w-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-4xl font-extrabold text-white">{logoInitial}</span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-15">
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-bold text-foreground">{team.name}</span>
            {team.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${tagColorClass(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-1 items-center">
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {team.description ?? '—'}
            </p>
          </div>

          <div className="my-2.5 h-px bg-border" />

          <div className="flex h-6 items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {shown.map((member, i) => (
                  <div key={member.id} className={i > 0 ? '-ml-2' : ''}>
                    <UserAvatar
                      initial={`${member.user.firstName.charAt(0)}${member.user.lastName.charAt(0)}`}
                      color={avatarColor(member.userId)}
                      avatarUrl={member.user.avatarUrl}
                      size="xs"
                      className="rounded-full ring-2 ring-card"
                    />
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="-ml-2 flex size-6 items-center justify-center rounded-full ring-2 ring-card bg-muted text-[8px] font-semibold text-muted-foreground">
                    +{overflow}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/70">{team.members.length} คน</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              <FolderOpen className="h-3 w-3" />
              <span>{team._count.projects} projects</span>
            </div>
          </div>
        </div>
      </div>
  );
}
