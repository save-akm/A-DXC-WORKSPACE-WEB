import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { ManagementShell } from '@/components/management/management-shell';
import {
  SIDEBAR_COOKIE_NAME,
  parseCollapsedCookie,
} from '@/lib/management/sidebar-cookie';

export default async function ManagementLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialCollapsed = parseCollapsedCookie(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);

  return <ManagementShell initialCollapsed={initialCollapsed}>{children}</ManagementShell>;
}
