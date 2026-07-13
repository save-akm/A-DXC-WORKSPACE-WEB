'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { cn } from '@/lib/utils';
import { useSocketEvent, useSocketEmit } from '@/components/socket';
import { useAuthStore } from '@/lib/stores/auth-store';

interface OnlineMember {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  email?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

const avatarBg = ['bg-fuchsia-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-amber-500'];
const bannerGradient = [
  'bg-gradient-to-r from-fuchsia-500 to-purple-600',
  'bg-gradient-to-r from-emerald-400 to-teal-600',
  'bg-gradient-to-r from-cyan-400 to-blue-600',
  'bg-gradient-to-r from-amber-400 to-orange-500',
];

function getInitials(user: OnlineMember) {
  const first = user.firstName?.trim().charAt(0);
  if (first) return first.toUpperCase();
  const nick = user.nickname?.trim().charAt(0);
  if (nick) return nick.toUpperCase();
  const email = user.email?.trim().charAt(0);
  if (email) return email.toUpperCase();
  return '?';
}

function normalizeUserPayload(payload: Record<string, unknown>): OnlineMember | null {
  const id = typeof payload.id === 'string' ? payload.id : undefined;
  const firstName = typeof payload.firstName === 'string' ? payload.firstName : '';
  const lastName = typeof payload.lastName === 'string' ? payload.lastName : '';
  const nickname = typeof payload.nickname === 'string' ? payload.nickname : null;
  const avatarUrl = typeof payload.avatarUrl === 'string' ? payload.avatarUrl : null;
  const email = typeof payload.email === 'string' ? payload.email : '';
  if (!id) return null;
  return { id, firstName: firstName || email || '', lastName: lastName || '', nickname, avatarUrl, email };
}

function getMembersFromPayload(payload: unknown): OnlineMember[] {
  if (Array.isArray(payload)) return payload.flatMap((item) => getMembersFromPayload(item));
  if (!payload || typeof payload !== 'object') return [];
  const maybePayload = payload as Record<string, unknown>;
  if ('user' in maybePayload && maybePayload.user && typeof maybePayload.user === 'object')
    return getMembersFromPayload(maybePayload.user);
  const member = normalizeUserPayload(maybePayload);
  return member ? [member] : [];
}

interface AvatarCardProps {
  member: OnlineMember;
  index: number;
  anchorRect: DOMRect;
  onClose: () => void;
}

function AvatarCard({ member, index, anchorRect, onClose }: AvatarCardProps) {
  const displayName = member.nickname ?? (`${member.firstName} ${member.lastName}`.trim() || 'Online user');
  const CARD_WIDTH = 256;
  const CARD_OFFSET = 8;

  // Position card below anchor, centered horizontally
  let left = anchorRect.left + anchorRect.width / 2 - CARD_WIDTH / 2;
  const top = anchorRect.bottom + CARD_OFFSET;

  // Clamp to viewport
  if (left < 8) left = 8;
  if (left + CARD_WIDTH > window.innerWidth - 8) left = window.innerWidth - CARD_WIDTH - 8;

  const card = (
    <div
      onMouseEnter={onClose /* noop — keep open via parent */}
      style={{
        position: 'fixed',
        top,
        left,
        width: CARD_WIDTH,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      className="overflow-hidden rounded-2xl bg-popover shadow-xl"
    >
      <div className={cn('h-14 w-full', bannerGradient[index % bannerGradient.length])} />
      <div className="-mt-7 flex flex-col items-center px-4 pb-4">
        <span
          className={cn(
            'inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-popover text-xl font-bold text-white shadow-md',
            member.avatarUrl ? 'bg-muted' : avatarBg[index % avatarBg.length],
          )}
        >
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            getInitials(member)
          )}
        </span>
        <p className="mt-2 text-center text-sm font-semibold text-foreground leading-tight">{displayName}</p>
        {member.email && (
          <p className="mt-0.5 break-all text-center text-xs text-muted-foreground leading-snug">{member.email}</p>
        )}
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Online
        </span>
      </div>
    </div>
  );

  return ReactDOM.createPortal(card, document.body);
}

export function TopbarAvatars() {
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emit = useSocketEmit();
  const currentUser = useAuthStore((s) => s.user);

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    openTimerRef.current = setTimeout(() => {
      setAnchorRect(rect);
      setHoveredIndex(index);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setHoveredIndex(null);
      setAnchorRect(null);
    }, 100);
  };

  const updateOnlineMembers = (users: OnlineMember[]) => {
    setOnlineMembers((prev) => {
      if (users.length > 1) return users.slice(0, 12);
      const user = users[0];
      const existingIndex = prev.findIndex((member) => member.id === user.id);
      if (existingIndex === -1) return [user, ...prev].slice(0, 12);
      const next = [...prev];
      next[existingIndex] = user;
      return next;
    });
  };

  useSocketEvent('user-online', (...args) => {
    const payload = args.length === 1 ? args[0] : args;
    const users = getMembersFromPayload(payload);
    if (users.length === 0) return;
    if (Array.isArray(payload)) { setOnlineMembers(users.slice(0, 12)); return; }
    updateOnlineMembers(users);
  });

  useSocketEvent('user-offline', (...args) => {
    const payload = args[0] as Record<string, unknown> | undefined;
    if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string') return;
    setOnlineMembers((prev) => prev.filter((member) => member.id !== payload.id));
  });

  useSocketEvent('presence:list', (...args) => {
    const payload = args[0];
    const users = getMembersFromPayload(payload);
    if (users.length > 0) setOnlineMembers(users.slice(0, 12));
  });

  useEffect(() => {
    emit('presence:list');
  }, [emit]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const membersToRender = useMemo(() => {
    const filtered = onlineMembers.filter((member) => member.id !== currentUser?.id);
    return filtered.slice(0, 4);
  }, [onlineMembers, currentUser?.id]);

  const remaining = Math.max(0, onlineMembers.filter((member) => member.id !== currentUser?.id).length - 4);

  return (
    <div className="flex items-center -space-x-2">
      {membersToRender.map((member, index) => (
        <span
          key={`${member.id ?? 'member'}-${index}`}
          onMouseEnter={(e) => handleMouseEnter(e, index)}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'inline-flex h-8 w-8 min-w-[2rem] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-background text-sm font-semibold text-white shadow-sm transition-transform hover:scale-110',
            member.avatarUrl ? 'bg-transparent' : avatarBg[index % avatarBg.length],
          )}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.nickname ?? `${member.firstName} ${member.lastName}`.trim()}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(member)
          )}
        </span>
      ))}

      {hoveredIndex !== null && anchorRect && membersToRender[hoveredIndex] && (
        <AvatarCard
          member={membersToRender[hoveredIndex]}
          index={hoveredIndex}
          anchorRect={anchorRect}
          onClose={handleMouseLeave}
        />
      )}

      {remaining > 0 && (
        <span className="inline-flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
}
