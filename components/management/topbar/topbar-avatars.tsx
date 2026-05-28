'use client';

import { useEffect, useMemo, useState } from 'react';
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

  return {
    id,
    firstName: firstName || email || '',
    lastName: lastName || '',
    nickname,
    avatarUrl,
    email,
  };
}

function getMembersFromPayload(payload: unknown): OnlineMember[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => getMembersFromPayload(item));
  }

  if (!payload || typeof payload !== 'object') return [];

  const maybePayload = payload as Record<string, unknown>;

  if ('user' in maybePayload && maybePayload.user && typeof maybePayload.user === 'object') {
    return getMembersFromPayload(maybePayload.user);
  }

  const member = normalizeUserPayload(maybePayload);
  return member ? [member] : [];
}

export function TopbarAvatars() {
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const emit = useSocketEmit();
  const currentUser = useAuthStore((s) => s.user);

  const updateOnlineMembers = (users: OnlineMember[]) => {
    setOnlineMembers((prev) => {
      if (users.length > 1) {
        return users.slice(0, 12);
      }

      const user = users[0];
      const existingIndex = prev.findIndex((member) => member.id === user.id);
      if (existingIndex === -1) {
        return [user, ...prev].slice(0, 12);
      }

      const next = [...prev];
      next[existingIndex] = user;
      return next;
    });
  };

  useSocketEvent('user-online', (...args) => {
    console.info('[TopbarAvatars] user-online', args);
    const payload = args.length === 1 ? args[0] : args;
    const users = getMembersFromPayload(payload);
    if (users.length === 0) return;

    if (Array.isArray(payload)) {
      setOnlineMembers(users.slice(0, 12));
      return;
    }

    updateOnlineMembers(users);
  });

  useSocketEvent('user-offline', (...args) => {
    const payload = args[0] as Record<string, unknown> | undefined;
    if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string') return;
    console.debug('[TopbarAvatars] user-offline', payload.id);
    setOnlineMembers((prev) => prev.filter((member) => member.id !== payload.id));
  });

  useSocketEvent('presence:list', (...args) => {
    const payload = args[0];
    console.debug('[TopbarAvatars] presence:list', payload);
    const users = getMembersFromPayload(payload);
    if (users.length > 0) {
      setOnlineMembers(users.slice(0, 12));
    }
  });

  useEffect(() => {
    console.info('[TopbarAvatars] emit presence:list');
    emit('presence:list');
  }, [emit]);

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
          title={member.nickname ?? (member.firstName || member.lastName ? `${member.firstName} ${member.lastName}`.trim() : 'Online user')}
          className={cn(
            'inline-flex h-8 w-8 min-w-[2rem] items-center justify-center overflow-hidden rounded-full border-2 border-background text-sm font-semibold text-white shadow-sm',
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
      {remaining > 0 && (
        <span className="inline-flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
}
