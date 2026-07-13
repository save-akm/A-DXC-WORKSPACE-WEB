'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { workspace } from '@/lib/management/nav-config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useCollapsed } from './sidebar-context';
import { SidebarHoverPopover } from './sidebar-hover-popover';

const GRADIENT_STYLE = {
  backgroundImage:
    'linear-gradient(135deg, var(--ws-grad-1) 0%, var(--ws-grad-2) 33%, var(--ws-grad-3) 66%, var(--ws-grad-4) 100%)',
  backgroundSize: '250% 250%',
} as const;

export function SidebarWorkspace2() {
  const collapsed = useCollapsed();
  const user = useAuthStore((s) => s.user);
  const reducedMotion = useReducedMotion();

  const position = user?.position ?? workspace.position;
  const role = user?.role ?? workspace.role;
  const subtitle = [position, role].filter(Boolean).join(' · ');

  const logoBadge = (
    <motion.span
      aria-hidden
      style={GRADIENT_STYLE}
      animate={
        reducedMotion
          ? {}
          : { backgroundPosition: ['0% 0%', '100% 50%', '0% 100%', '0% 0%'] }
      }
      transition={{
        backgroundPosition: { duration: 12, repeat: Infinity, ease: 'linear' },
      }}
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden text-sm text-white',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_10px_-2px_var(--ws-glow-a)] ring-1 ring-white/25',
        collapsed ? 'size-10 rounded-xl' : 'size-9 rounded-lg',
      )}
    >
      <span className="font-black drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
        {workspace.initial}
      </span>
      {/* hover sheen sweep across the badge */}
      <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/30 blur-[2px] transition-transform duration-500 ease-out group-hover/ws2:translate-x-[400%] motion-reduce:hidden" />
    </motion.span>
  );

  return (
    <SidebarHoverPopover
      enabled={collapsed}
      label={
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{workspace.name}</span>
          {subtitle ? (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </div>
      }
    >
      <motion.button
        type="button"
        aria-label={workspace.name}
        whileHover={reducedMotion ? undefined : { y: -1 }}
        whileTap={reducedMotion ? undefined : { y: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
        className={cn(
          'group/ws2 relative isolate flex cursor-pointer items-center text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          collapsed
            ? 'size-10 justify-center rounded-xl'
            : cn(
                'w-full gap-3 rounded-xl border border-border/60 bg-card/60 px-2.5 py-2 shadow-xs',
                'transition-colors duration-300 hover:border-[var(--ws-glow-b)] hover:bg-card',
              ),
        )}
      >
        {/* soft brand aura behind the badge */}
        {!collapsed ? (
          <span
            aria-hidden
            style={{ background: 'var(--ws-glow-a)' }}
            className="pointer-events-none absolute left-1 top-1/2 -z-10 size-10 -translate-y-1/2 rounded-full opacity-25 blur-xl transition-opacity duration-300 group-hover/ws2:opacity-50"
          />
        ) : null}

        {logoBadge}

        {!collapsed ? (
          <motion.span
            animate={{ opacity: 1, width: 'auto' }}
            initial={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex min-w-0 flex-1 flex-col overflow-hidden"
          >
            <span className="truncate text-sm font-semibold leading-tight text-foreground">
              {workspace.name}
            </span>
            {subtitle ? (
              <span className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
                {subtitle}
              </span>
            ) : null}
          </motion.span>
        ) : null}
      </motion.button>
    </SidebarHoverPopover>
  );
}
