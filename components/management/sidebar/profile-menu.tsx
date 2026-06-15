'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, LogOut, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';

interface ProfileMenuUser {
  name: string;
  email: string;
  initial: string;
  color: string;
  avatarUrl?: string | null;
}

interface ProfileMenuItem {
  icon: LucideIcon;
  label: string;
  hint?: string;
  shortcut?: string;
  onClick?: () => void;
  destructive?: boolean;
}

interface ProfileMenuProps {
  open: boolean;
  onClose: () => void;
  /** Element that wraps both the trigger and this menu — clicks inside it never close the menu. */
  containerRef: React.RefObject<HTMLElement | null>;
  user: ProfileMenuUser;
  onLogout?: () => void;
}

export function ProfileMenu({
  open,
  onClose,
  containerRef,
  user,
  onLogout,
}: ProfileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, containerRef]);

  const router = useRouter();
  const handle = (cb?: () => void) => () => {
    cb?.();
    onClose();
  };

  const primaryItems: ProfileMenuItem[] = [
    {
      icon: User,
      label: 'Account',
      shortcut: '⇧ ⌘ A',
      onClick: handle(() => router.push('/account')),
    },
    {
      icon: KeyRound,
      label: 'Security',
      onClick: handle(() => router.push('/security')),
    },
  ];

  const logoutItem: ProfileMenuItem = {
    icon: LogOut,
    label: 'Log out',
    shortcut: '⇧ ⌘ Q',
    destructive: true,
    onClick: handle(onLogout),
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="menu"
          initial={{ opacity: 0, x: -8, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="absolute bottom-0 left-full z-50 ml-2 w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
        >
          {/* Header */}
          <div className="relative flex items-center gap-2.5 overflow-hidden border-b border-border/60 bg-linear-to-r from-violet-500/15 via-fuchsia-500/15 to-amber-500/15 p-3">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-6 size-24 rounded-full bg-fuchsia-500/15 blur-2xl"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -left-6 size-20 rounded-full bg-sky-500/15 blur-2xl"
            />
            <span className="relative ring-2 ring-background rounded-full">
              <UserAvatar
                avatarUrl={user.avatarUrl ?? null}
                initial={user.initial}
                color={user.color}
                size="md"
                showStatus
                statusRingClass="bg-popover"
                alt={user.name}
              />
            </span>
            <div className="relative flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col p-1">
            {primaryItems.map((item, i) => (
              <ProfileMenuRow key={i} item={item} />
            ))}
          </div>

          <div className="border-t border-border/60 p-1">
            <ProfileMenuRow item={logoutItem} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProfileMenuRow({ item }: { item: ProfileMenuItem }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      role="menuitem"
      onClick={item.onClick}
      className={cn(
        'group/mi flex cursor-pointer w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
        item.destructive
          ? 'text-foreground/85 hover:bg-destructive/10 hover:text-destructive'
          : 'text-foreground/85 hover:bg-accent/60 hover:text-foreground',
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0 transition-transform',
          'group-hover/mi:scale-110',
          item.destructive && 'group-hover/mi:text-destructive',
        )}
      />
      <span className="flex-1 text-left">{item.label}</span>
      {item.shortcut ? (
        <span className="font-mono text-[10px] tracking-tight text-muted-foreground/70">
          {item.shortcut}
        </span>
      ) : null}
    </button>
  );
}
