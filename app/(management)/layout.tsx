import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { ManagementShell } from '@/components/management/management-shell';
import {
  SIDEBAR_COOKIE_NAME,
  parseCollapsedCookie,
} from '@/lib/management/sidebar-cookie';

export default async function ManagementLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialCollapsed = parseCollapsedCookie(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);

  return (
    // Honor prefers-reduced-motion for every Framer Motion animation in the
    // dashboard: transform/layout animations are skipped, opacity still fades.
    <MotionConfig reducedMotion="user">
      <ManagementShell initialCollapsed={initialCollapsed}>{children}</ManagementShell>
    </MotionConfig>
  );
}
