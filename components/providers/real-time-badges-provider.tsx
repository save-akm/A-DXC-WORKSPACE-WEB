'use client';

import { useProjectSurveyBadgeSync } from '@/lib/hooks/use-project-survey-badge-sync';

/**
 * Syncs real-time badge counts from socket.io to the sidebar menu.
 * Wrap this around the management layout or root app layout so the hooks
 * run and keep badges in sync.
 */
export function RealtimeBadgesProvider({ children }: { children: React.ReactNode }) {
  useProjectSurveyBadgeSync();

  return <>{children}</>;
}
