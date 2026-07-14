import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { fetchSurveys } from '@/lib/api/project-surveys';
import { useSocketEvents } from './use-socket-events';

/**
 * Badge count for the project-survey menu — documents the current user created
 * that are still in SEND state (not yet under review).
 *
 * Initial count comes from a single API call (`status=SEND&mine`), then
 * socket.io keeps it fresh as documents move through the pipeline.
 */
export function useProjectSurveyBadge(): number | null {
  const meId = useAuthStore((s) => s.user?.id ?? '');
  const [count, setCount] = useState<number | null>(null);

  // Initial count
  useEffect(() => {
    if (!meId) return;

    let stale = false;
    fetchSurveys({ status: 'SEND', mine: true, page: 1, limit: 1 })
      .then((r) => {
        if (!stale) setCount(r.total);
      })
      .catch(() => {
        if (!stale) setCount(null);
      });

    return () => {
      stale = true;
    };
  }, [meId]);

  // Keep in sync via socket.io. When any user's survey status changes,
  // emit a `survey:statusChanged` event (see backend spec below).
  // This hook filters to changes that affect the count:
  // - SEND→REVIEW (owned by me) reduces count by 1
  // - *→SEND (owned by me) increases count by 1
  useSocketEvents({
    'survey:statusChanged': (data: {
      surveyId: string;
      requesterId: string;
      oldStatus: string;
      newStatus: string;
    }) => {
      if (data.requesterId !== meId) return;
      setCount((prev) => {
        if (prev === null) return null;
        if (data.oldStatus === 'SEND' && data.newStatus !== 'SEND') return Math.max(0, prev - 1);
        if (data.oldStatus !== 'SEND' && data.newStatus === 'SEND') return prev + 1;
        return prev;
      });
    },
  });

  return count;
}
