'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { useSidebarUIStore } from '@/lib/stores/sidebar-ui-store';
import { SidebarCollapsedProvider } from './sidebar-context';
import { SidebarContent } from './sidebar-content';

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 64;
const MOBILE_WIDTH = 288;

export function Sidebar() {
  const collapsed = useSidebarUIStore((s) => s.collapsed);
  const isMobileOpen = useSidebarUIStore((s) => s.isMobileOpen);
  const setMobileOpen = useSidebarUIStore((s) => s.setMobileOpen);

  useBodyScrollLock(isMobileOpen);

  return (
    <>
      {/* Mobile: off-canvas drawer (always expanded) */}
      <SidebarCollapsedProvider value={false}>
        <AnimatePresence>
          {isMobileOpen ? (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              aria-hidden
            />
          ) : null}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={{ x: isMobileOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{ width: MOBILE_WIDTH }}
          className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/60 bg-sidebar shadow-xl md:hidden print:hidden"
          aria-label="Sidebar"
          aria-hidden={!isMobileOpen}
        >
          <SidebarContent />
        </motion.aside>
      </SidebarCollapsedProvider>

      {/* Desktop: in-flow, collapsible to icon-only */}
      <SidebarCollapsedProvider value={collapsed}>
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          data-collapsed={collapsed}
          className="relative hidden h-svh shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex print:hidden"
          aria-label="Sidebar"
        >
          <SidebarContent />
        </motion.aside>
      </SidebarCollapsedProvider>
    </>
  );
}
