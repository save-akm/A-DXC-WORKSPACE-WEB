'use client';

import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { fetchSurveyNotifications, markNotificationRead } from '@/lib/api/project-surveys';
import type { SurveyNotification } from '@/lib/project-survey/types';
import { formatDateTime } from '@/lib/project-survey/labels';

/** In-app notifications for this survey. USER sees own; reviewer/admin see all. */
export function NotificationsCard({ surveyId }: { surveyId: string }) {
  const [items, setItems] = useState<SurveyNotification[] | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSurveyNotifications(surveyId)
      .then((n) => { if (!cancelled) setItems(n); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [surveyId]);

  async function handleMarkRead(n: SurveyNotification) {
    setMarkingId(n.id);
    try {
      const updated = await markNotificationRead(n.id);
      setItems((prev) => prev?.map((x) => (x.id === updated.id ? { ...x, isRead: true } : x)) ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปเดตการแจ้งเตือนไม่สำเร็จ');
    } finally {
      setMarkingId(null);
    }
  }

  const unread = items?.filter((n) => !n.isRead).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={15} className="text-muted-foreground" />
          การแจ้งเตือน
          {unread > 0 && (
            <span className="rounded-full bg-brand-muted px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {unread} ยังไม่อ่าน
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <ul className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="space-y-1.5">
                <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>
        ) : (
          <ul className="space-y-1">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'flex items-start gap-2 rounded-lg px-2 py-1.5',
                  !n.isRead && 'bg-brand-muted/40',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    n.isRead ? 'bg-border' : 'bg-brand',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-xs leading-snug', !n.isRead && 'font-medium')} title={n.subject}>
                    {n.subject}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatDateTime(n.sentAt)}</p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={markingId === n.id}
                    onClick={() => handleMarkRead(n)}
                    aria-label="ทำเครื่องหมายว่าอ่านแล้ว"
                    title="ทำเครื่องหมายว่าอ่านแล้ว"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Check size={13} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
