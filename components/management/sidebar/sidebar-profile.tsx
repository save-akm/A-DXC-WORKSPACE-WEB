'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useGreeting } from '@/hooks/use-greeting';
import { useLogout } from '@/hooks/use-logout';
import { currentUser } from '@/lib/management/nav-config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ProfileMenu } from './profile-menu';
import { useCollapsed } from './sidebar-context';

export function SidebarProfile() {
  const collapsed = useCollapsed();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const greeting = useGreeting();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : currentUser.name;
  const greetingName = user?.nickname?.trim() || user?.firstName || currentUser.name.split(' ')[0];
  const email = user?.email ?? currentUser.email;
  const initial = (user?.firstName?.[0] ?? currentUser.initial).toUpperCase();
  const color = currentUser.color;
  const avatarUrl = user?.avatarUrl ?? null;

  return (
    <div className="border-t border-border/60 p-2">
      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1.5 px-2 pb-2 text-[12px] font-medium text-foreground/70">
              <span>{greeting.emoji}</span>
              <span className="truncate">
                {greeting.text}, <span className="text-foreground">คุณ {greetingName}</span>
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-foreground/[0.06]">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`Profile: ${name}`}
            aria-expanded={menuOpen}
            className="group/profile flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <UserAvatar
              avatarUrl={avatarUrl}
              initial={initial}
              color={color}
              size="sm"
              showStatus
              statusRingClass="bg-sidebar"
              alt={name}
            />

            <motion.span
              animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex min-w-0 flex-1 flex-col overflow-hidden"
            >
              <span className="truncate text-sm font-semibold leading-tight text-foreground">
                {name}
              </span>
              <span className="truncate text-[11px] leading-tight text-muted-foreground">
                {email}
              </span>
            </motion.span>
          </button>

          {!collapsed ? (
            <motion.button
  type="button"
  onClick={() => setMenuOpen((v) => !v)}
  aria-label="Settings"
  aria-expanded={menuOpen}
  animate={{ rotate: menuOpen ? 90 : 0 }}
  whileHover={
    menuOpen
      ? undefined
      : {
          rotate: 45,
          scale: 1.08,
        }
  }
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
  className={cn(
    'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md',
    'transition-all duration-200',

    menuOpen
      ? 'bg-violet-500/15 text-violet-600 shadow-sm dark:text-violet-400'
      : [
          'text-muted-foreground',

          // hover colors
          'hover:bg-gradient-to-br',
          'hover:from-violet-500/15',
          'hover:via-fuchsia-500/10',
          'hover:to-pink-500/15',

          'hover:text-violet-600 dark:hover:text-violet-400',

          // glow
          'hover:shadow-[0_0_18px_rgba(139,92,246,0.28)]',

          // border
          'hover:ring-1 hover:ring-violet-400/30',
        ],
  )}
>
  <Settings className="size-4" />
</motion.button>
          ) : null}
        </div>

        <ProfileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          containerRef={containerRef}
          user={{ name, email, initial, color, avatarUrl }}
          onAccount={() => console.log('account')}
          onSecurity={() => console.log('security')}
          onLogout={logout}
        />
      </div>
    </div>
  );
}
