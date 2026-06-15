'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { workspace } from '@/lib/management/nav-config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useCollapsed } from './sidebar-context';
import { SidebarHoverPopover } from './sidebar-hover-popover';

export function SidebarWorkspace() {
  const collapsed = useCollapsed();
  const user = useAuthStore((s) => s.user);
  const reducedMotion = useReducedMotion();

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
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </div>
      }
    >
      <motion.button
        type="button"
        whileHover={reducedMotion ? undefined : { y: -1 }}
        whileTap={{ y: 0, scale: 0.98 }}
        style={{
          backgroundImage:
            'linear-gradient(135deg, var(--ws-grad-1) 0%, var(--ws-grad-2) 33%, var(--ws-grad-3) 66%, var(--ws-grad-4) 100%)',
          backgroundSize: '300% 300%',
        }}
        animate={
          reducedMotion
            ? {}
            : { backgroundPosition: ['0% 0%', '100% 50%', '0% 100%', '0% 0%'] }
        }
        transition={{
          type: 'spring',
          stiffness: 360,
          damping: 24,
          backgroundPosition: { duration: 14, repeat: Infinity, ease: 'linear' },
        }}
        className={cn(
          'group/ws relative isolate flex cursor-pointer items-center overflow-hidden rounded-xl border border-white/15 text-left',
          'shadow-[0_4px_20px_-4px_var(--ws-glow-a),0_2px_8px_-2px_var(--ws-glow-b)]',
          'transition-shadow duration-300',
          'hover:shadow-[0_6px_28px_-4px_var(--ws-glow-a),0_4px_14px_-2px_var(--ws-glow-b)]',
          collapsed
            ? 'size-10 justify-center'
            : 'w-full gap-3 px-3 py-2.5',
        )}
      >
        {/* ambient glow blobs */}
        <span
          aria-hidden
          style={{ background: 'var(--ws-glow-a)' }}
          className="pointer-events-none absolute -right-6 -top-10 -z-10 size-24 rounded-full opacity-60 blur-2xl transition-[opacity,transform] duration-500 group-hover/ws:translate-x-2 group-hover/ws:opacity-90"
        />
        <span
          aria-hidden
          style={{ background: 'var(--ws-glow-b)' }}
          className="pointer-events-none absolute -bottom-10 -left-6 -z-10 size-20 rounded-full opacity-50 blur-2xl transition-[opacity,transform] duration-500 group-hover/ws:-translate-x-1 group-hover/ws:opacity-75"
        />

        {/* top edge specular highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-linear-to-r from-transparent via-white/50 to-transparent"
        />
        {/* bottom edge depth line */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-linear-to-r from-transparent via-white/10 to-transparent"
        />

        {/* logo badge */}
        {collapsed ? (
          <span className="relative text-sm font-black text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
            {workspace.initial}
          </span>
        ) : (
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-black text-white shadow-inner ring-1 ring-white/30 backdrop-blur-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            {workspace.initial}
          </span>
        )}

        {!collapsed ? (
          <motion.span
            animate={{ opacity: 1, width: 'auto' }}
            initial={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex min-w-0 flex-1 flex-col overflow-hidden"
          >
            <span className="truncate text-sm font-bold leading-tight text-white">
              {workspace.name}
            </span>
            {subtitle ? (
              <span className="mt-0.5 truncate text-xs font-medium leading-tight text-white/70">
                {subtitle}
              </span>
            ) : null}
          </motion.span>
        ) : null}
      </motion.button>
    </SidebarHoverPopover>
  );
}
