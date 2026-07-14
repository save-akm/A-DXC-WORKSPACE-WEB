import { useEffect } from 'react';
import { useMenuBadgesStore } from '@/lib/stores/menu-badges-store';
import { useProjectSurveyBadge } from './use-project-survey-badge';

/**
 * Syncs the real-time project-survey badge count (from socket.io) to the
 * sidebar menu badge store. Call this once from a top-level component
 * (e.g., the layout that wraps all pages).
 */
export function useProjectSurveyBadgeSync(): void {
  const count = useProjectSurveyBadge();
  const setBadge = useMenuBadgesStore((s) => s.setBadge);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      setBadge('project_survey', null);
    } else {
      setBadge('project_survey', count);
    }
  }, [count, setBadge]);
}
