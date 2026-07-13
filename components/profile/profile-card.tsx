'use client';

import { useState } from 'react';
import {
  Building2,
  Check,
  Copy,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { StarRating } from './star-rating';
import type { UserProfileData, UserSkill, ProfileUser } from '@/lib/api/profile';

const fallbackColor = 'bg-gradient-to-br from-violet-500 to-fuchsia-600';

const coverGradients = [
  'from-violet-600 via-fuchsia-500 to-pink-500',
  'from-sky-500 via-cyan-500 to-teal-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-rose-500 via-pink-500 to-fuchsia-500',
];

function pickGradient(seed: string): string {
  const idx = seed.charCodeAt(0) % coverGradients.length;
  return coverGradients[idx];
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

interface ReviewStats { average: number | null; total: number }

interface ProfileCardProps {
  user: ProfileUser;
  profile: UserProfileData;
  skills: UserSkill[];
  reviewStats?: ReviewStats;
  postCount?: number;
  totalPostLikes?: number;
  isOwn: boolean;
  onLike?: () => Promise<void>;
  /** Show the like button/count + posts/likes stats. Defaults to true. */
  social?: boolean;
  /** Show star rating + review count. Defaults to true. */
  showReview?: boolean;
  /** `compact` — landing / directory cards: shorter cover, clamped text, glass hover. */
  variant?: 'full' | 'compact';
  className?: string;
}

export function ProfileCard({
  user,
  profile,
  skills,
  reviewStats,
  postCount = 0,
  totalPostLikes = 0,
  isOwn,
  onLike,
  social = true,
  showReview = true,
  variant = 'full',
  className,
}: ProfileCardProps) {
  const [liking, setLiking] = useState(false);
  const compact = variant === 'compact';

  const handleLike = async () => {
    if (!onLike || liking) return;
    setLiking(true);
    try { await onLike() } finally { setLiking(false) }
  };

  const initial = (user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase();
  const coverGrad = profile.coverUrl ? null : pickGradient(user.department?.code ?? 'A');
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const branchCode = user.department?.branch?.code;

  const visibleSkills = compact ? skills.slice(0, 3) : skills;
  const extraSkills = compact ? Math.max(0, skills.length - 3) : 0;

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl border',
        compact
          ? 'min-h-[400px] border-border bg-card/60 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-xl hover:shadow-brand/10'
          : 'border-border bg-card shadow-lg shadow-black/5',
        className,
      )}
    >
      {/* Cover */}
      <div className={cn('relative w-full overflow-hidden', compact ? 'h-20' : 'h-28')}>
        {profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="cover" className="h-full w-full object-cover" />
        ) : (
          <div className={cn('h-full w-full bg-linear-to-r', coverGrad)} />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Avatar row */}
      <div className={cn('relative flex items-end justify-between px-4', compact ? '-mt-8' : '-mt-10')}>
        {compact ? (
          <div className="rounded-full p-0.5 ring-4 ring-card shadow-lg">
            <UserAvatar
              avatarUrl={user.avatarUrl}
              initial={initial}
              color={fallbackColor}
              size="lg"
              showStatus={false}
              statusRingClass="bg-card"
            />
          </div>
        ) : (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer rounded-full p-1 ring-4 ring-card shadow-xl transition-transform hover:scale-105">
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  initial={initial}
                  color={fallbackColor}
                  size="xl"
                  showStatus={profile.isActive}
                  statusRingClass="bg-card"
                />
              </div>
            </HoverCardTrigger>
            <HoverCardContent side="right" align="start" sideOffset={12} className="w-auto p-0">
              <div className="overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/20">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={fullName}
                    className="size-56 object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className={cn('flex size-56 items-center justify-center text-6xl font-bold text-white', fallbackColor)}>
                    {initial}
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        )}

        {social ? (
          <div className="mb-6 flex flex-col items-center gap-1.5">
            {!isOwn ? (
              <Button
                type="button"
                variant={profile.isLiked ? 'default' : 'outline'}
                onClick={handleLike}
                disabled={liking}
                className={cn(
                  'h-9 rounded-full px-3.5 gap-1.5 text-sm font-semibold shadow-sm transition-all',
                  profile.isLiked
                    ? 'bg-rose-500 hover:bg-rose-600 border-rose-500 text-white shadow-rose-500/20'
                    : 'hover:border-rose-400 hover:text-rose-500',
                )}
              >
                <Heart className={cn('size-5', profile.isLiked && 'fill-current')} />
                Like
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur">
                <Heart className="size-5 fill-rose-400 text-rose-500" />
                <span>{fmt(profile.likeCount)}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {fmt(postCount)} posts&nbsp;&nbsp;{fmt(totalPostLikes)} likes
            </p>
          </div>
        ) : compact && branchCode ? (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand backdrop-blur">
            <Building2 className="size-2.5" />
            {branchCode}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className={cn('flex flex-1 flex-col p-4', compact ? 'pt-2' : 'pt-4')}>

        {/* Name + Nickname */}
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className={cn('font-bold leading-tight text-foreground', compact ? 'text-base' : 'text-lg')}>
              {fullName}
            </h2>
            {user.nickname && (
              <span className="text-sm text-muted-foreground">@{user.nickname}</span>
            )}
          </div>

          {/* Full: bio before highlight */}
          {!compact && profile.bio && (
            <p className="text-xs leading-relaxed text-muted-foreground">{profile.bio}</p>
          )}
        </div>

        {/* Highlight — right after name in compact (emphasised) */}
        {profile.highlight?.content && (
          <div className={compact ? 'mt-2.5' : 'mt-3.5'}>
            <HighlightBlock
              type={profile.highlight.type}
              content={profile.highlight.content}
              compact={compact}
            />
          </div>
        )}

        {/* Compact: bio after highlight, clamped */}
        {compact && profile.bio && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{profile.bio}</p>
        )}

        {/* Review */}
        {showReview && (
          <div className="mt-3.5 flex items-center gap-2">
            <StarRating value={reviewStats?.average ?? 0} size="base" />
            <span className="text-xs text-muted-foreground">
              {reviewStats && reviewStats.total > 0
                ? `${reviewStats.average?.toFixed(1)} (${reviewStats.total} รีวิว)`
                : 'ยังไม่มีรีวิว'}
            </span>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className={compact ? 'mt-2.5' : 'mt-3.5'}>
            <div className="flex flex-wrap gap-1.5">
              {visibleSkills.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    compact
                      ? 'border-brand/20 bg-brand/10 text-brand'
                      : 'border-indigo-200/70 bg-indigo-500/8 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300',
                  )}
                >
                  {s.name}
                </span>
              ))}
              {extraSkills > 0 && (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  +{extraSkills}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Info + contact — pinned to bottom in compact for equal card height */}
        <div className={cn('space-y-1.5 text-xs text-muted-foreground', compact ? 'mt-auto pt-3' : 'mt-3.5')}>
          <InfoRow icon={Shield}>
            <span className={cn('font-medium', compact ? 'text-brand' : 'text-violet-600 dark:text-violet-400')}>
              {user.position?.name ?? '—'}
            </span>
          </InfoRow>
          <InfoRow icon={Building2}>
            {user.department?.code}
            {user.departmentUnit ? ` · ${user.departmentUnit.code}` : ''}
          </InfoRow>
          <InfoRow icon={MapPin}>
            {user.department?.branch?.name ?? '—'}
          </InfoRow>
          {user.email && <InfoRow icon={Mail} copyValue={user.email}>{user.email}</InfoRow>}
          {user.phone && <InfoRow icon={Phone} copyValue={user.phone}>{user.phone}</InfoRow>}
        </div>
      </div>
    </article>
  );
}

function InfoRow({ icon: Icon, children, copyValue }: { icon: LucideIcon; children: React.ReactNode; copyValue?: string }) {
  const [copied, setCopied] = useState(false);

  if (!copyValue) {
    return (
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-muted-foreground/50" />
        <span className="truncate">{children}</span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(copyValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full items-center gap-2 rounded cursor-copy transition-colors hover:text-foreground"
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground/50" />
      <span className="truncate">{children}</span>
      {copied
        ? <Check className="size-3 shrink-0 text-emerald-500" />
        : <Copy className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />}
    </button>
  );
}

const highlightMeta: Record<string, { tagCls: string; italic: boolean }> = {
  QUOTE:       { tagCls: 'bg-violet-500 text-white',  italic: true  },
  TIP:         { tagCls: 'bg-sky-500 text-white',     italic: false },
  GOAL:        { tagCls: 'bg-emerald-500 text-white', italic: false },
  ACHIEVEMENT: { tagCls: 'bg-amber-500 text-white',   italic: false },
};

function HighlightBlock({ type, content, compact = false }: { type: string; content: string; compact?: boolean }) {
  const meta = highlightMeta[type] ?? highlightMeta.QUOTE;
  return (
    <div
      className={cn(
        compact && 'rounded-xl border border-border/60 bg-muted/30 p-2.5',
      )}
    >
      <span className={cn('mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', meta.tagCls)}>
        {type}
      </span>
      <p
        className={cn(
          'leading-relaxed text-muted-foreground',
          compact ? 'line-clamp-2 text-xs' : 'text-sm',
          meta.italic && 'italic',
        )}
      >
        {type === 'QUOTE' ? `"${content}"` : content}
      </p>
    </div>
  );
}
