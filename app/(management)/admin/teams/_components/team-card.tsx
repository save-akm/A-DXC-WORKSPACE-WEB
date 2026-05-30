'use client';

import type React from 'react';
import { useState } from 'react';
import { Pencil, Trash2, FolderOpen } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ActionMenu } from '@/components/management/action-menu';
import type { Team } from '../types';

const BANNER_GRADIENTS: string[] = [
  'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
  'linear-gradient(135deg, #14b8a6, #06b6d4, #0ea5e9)',
  'linear-gradient(135deg, #a855f7, #ec4899, #f97316)',
  'linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)',
  'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #0ea5e9, #3b82f6, #6366f1)',
];

const PROJECT_BADGE_CLASSES: string[] = [
  'bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400',
  'bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400',
  'bg-violet-500/10 border border-violet-500/25 text-violet-600 dark:text-violet-400',
  'bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400',
  'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
  'bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400',
];

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
  index: number;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamCard({ team, index, onEdit, onDelete }: TeamCardProps) {
  const [logoError, setLogoError] = useState(false);
  const accentIdx = index % BANNER_GRADIENTS.length;
  const bannerStyle: React.CSSProperties = { background: BANNER_GRADIENTS[accentIdx] };

  const sorted = [...team.members].sort((a, b) =>
    a.roleInTeam === 'LEAD' ? -1 : b.roleInTeam === 'LEAD' ? 1 : 0,
  );
  const shown = sorted.slice(0, 3);
  const overflow = team.members.length - shown.length;
  const logoInitial = team.name.charAt(0).toUpperCase();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-indigo-500/30 hover:shadow-lg">
      {/* Banner */}
      <div className="relative h-[72px] shrink-0" style={bannerStyle}>
        {/* ActionMenu uses its own MoreHorizontal trigger button */}
        <div className="absolute right-2 top-2">
          <ActionMenu
            actions={[
              { icon: Pencil, label: 'แก้ไขทีม', onClick: () => onEdit(team) },
              { icon: Trash2, label: 'ลบทีม', destructive: true, onClick: () => onDelete(team) },
            ]}
          />
        </div>
        <div
          className="absolute -bottom-[18px] left-[14px] flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border-[3px] border-card"
          style={{ background: BANNER_GRADIENTS[accentIdx] }}
        >
          {team.logoUrl && !logoError ? (
            <img
              src={team.logoUrl}
              alt={team.name}
              className="h-full w-full object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-[15px] font-extrabold text-white">{logoInitial}</span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-6">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {shown.map((member, i) => (
                <div key={member.id} className={i > 0 ? '-ml-2' : ''}>
                  <UserAvatar
                    initial={`${member.user.firstName.charAt(0)}${member.user.lastName.charAt(0)}`}
                    color={avatarColor(member.userId)}
                    avatarUrl={member.user.avatarUrl}
                    size="xs"
                    className="border-2 border-card"
                  />
                </div>
              ))}
              {overflow > 0 && (
                <div className="-ml-2 flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[8px] font-semibold text-muted-foreground">
                  +{overflow}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/70">{team.members.length} คน</span>
          </div>
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${PROJECT_BADGE_CLASSES[accentIdx]}`}>
            <FolderOpen className="h-3 w-3" />
            <span>{team._count.projects} projects</span>
          </div>
        </div>
      </div>
    </div>
  );
}
