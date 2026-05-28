'use client';

import { ChevronsUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { workspace } from '@/lib/management/nav-config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useCollapsed } from './sidebar-context';
import { SidebarHoverPopover } from './sidebar-hover-popover';

export function SidebarWorkspace() {
  const collapsed = useCollapsed();
  const user = useAuthStore((s) => s.user);

  const position = user?.position ?? workspace.position;
  const role = user?.role ?? workspace.role;
  const subtitle = [position, role].filter(Boolean).join(' · ');

  return (
    <SidebarHoverPopover
      enabled={collapsed}
      label={
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{workspace.name}</span>
          {subtitle ? (
            <span className="text-[10px] text-muted-foreground">{subtitle}</span>
          ) : null}
        </div>
      }
    >
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ y: 0, scale: 0.98 }}
        style={{
          backgroundImage:
            'linear-gradient(135deg, var(--ws-grad-1) 0%, var(--ws-grad-2) 33%, var(--ws-grad-3) 66%, var(--ws-grad-4) 100%)',
          backgroundSize: '300% 300%',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 50%', '0% 100%', '0% 0%'] }}
        transition={{
          type: 'spring',
          stiffness: 360,
          damping: 24,
          backgroundPosition: { duration: 14, repeat: Infinity, ease: 'linear' },
        }}
        className={cn(
          'group/ws relative isolate flex cursor-pointer items-center overflow-hidden rounded-lg border border-white/15 text-left shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35',
          collapsed
            ? 'size-10 justify-center'
            : 'w-full gap-2.5 px-2.5 py-2',
        )}
      >
        {/* ambient glow blobs — adapt to theme */}
        <span
          aria-hidden
          style={{ background: 'var(--ws-glow-a)' }}
          className="pointer-events-none absolute -right-6 -top-10 -z-10 size-24 rounded-full opacity-80 blur-2xl transition-opacity duration-300 group-hover/ws:opacity-100"
        />
        <span
          aria-hidden
          style={{ background: 'var(--ws-glow-b)' }}
          className="pointer-events-none absolute -bottom-10 -left-6 -z-10 size-20 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover/ws:opacity-100"
        />
        {/* subtle top highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />

        {collapsed ? (
          <span className="relative text-base font-bold text-white drop-shadow">
            {workspace.initial}
          </span>
        ) : (
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base font-bold text-white shadow-inner ring-1 ring-white/25 backdrop-blur">
            {workspace.initial}
          </span>
        )}

        {!collapsed ? (
          <>
            <motion.span
              animate={{ opacity: 1, width: 'auto' }}
              initial={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex min-w-0 flex-1 flex-col overflow-hidden"
            >
              <span className="truncate text-sm font-semibold leading-tight text-white">
                {workspace.name}
              </span>
              {subtitle ? (
                <span className="truncate text-[11px] font-medium leading-tight text-white/75">
                  {subtitle}
                </span>
              ) : null}
            </motion.span>

            <ChevronsUpDown className="size-4 shrink-0 text-white/70 transition-colors group-hover/ws:text-white" />
          </>
        ) : null}
      </motion.button>
    </SidebarHoverPopover>
  );
}
