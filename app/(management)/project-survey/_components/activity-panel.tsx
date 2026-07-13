'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, ListChecks, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import { fetchActions, fetchAuditLogs, fetchHistory } from '@/lib/api/project-surveys';
import type {
  SurveyActionEntry, SurveyAuditLog, SurveyHistoryEntry,
} from '@/lib/project-survey/types';
import { STATUS_LABELS, formatDateTime, fullName } from '@/lib/project-survey/labels';

type TabKey = 'history' | 'actions' | 'audit';

interface ActivityPanelProps {
  surveyId: string;
  /** Audit logs are reviewer/admin only (project_survey:UPDATE). */
  showAudit: boolean;
}

/** Timeline card: status history / action log / audit log behind pill tabs. */
export function ActivityPanel({ surveyId, showAudit }: ActivityPanelProps) {
  const [tab, setTab] = useState<TabKey>('history');
  const [history, setHistory] = useState<SurveyHistoryEntry[] | null>(null);
  const [actions, setActions] = useState<SurveyActionEntry[] | null>(null);
  const [audit, setAudit] = useState<SurveyAuditLog[] | null>(null);

  // Lazy-load each tab's data on first visit.
  useEffect(() => {
    let cancelled = false;
    if (tab === 'history' && history === null) {
      fetchHistory(surveyId).then((d) => { if (!cancelled) setHistory(d); }).catch(() => { if (!cancelled) setHistory([]); });
    } else if (tab === 'actions' && actions === null) {
      fetchActions(surveyId).then((d) => { if (!cancelled) setActions(d); }).catch(() => { if (!cancelled) setActions([]); });
    } else if (tab === 'audit' && audit === null) {
      fetchAuditLogs(surveyId).then((d) => { if (!cancelled) setAudit(d); }).catch(() => { if (!cancelled) setAudit([]); });
    }
    return () => { cancelled = true; };
  }, [tab, surveyId, history, actions, audit]);

  const tabs: { key: TabKey; label: string; icon: typeof History }[] = [
    { key: 'history', label: 'สถานะ', icon: History },
    { key: 'actions', label: 'กิจกรรม', icon: ListChecks },
    ...(showAudit ? [{ key: 'audit' as const, label: 'Audit', icon: ShieldCheck }] : []),
  ];

  const loadingList = (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex gap-2.5">
          <div className="size-6 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );

  const emptyText = (text: string) => (
    <p className="py-4 text-center text-xs text-muted-foreground">{text}</p>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <History size={15} className="text-muted-foreground" />
            ประวัติ
          </CardTitle>
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                  tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="ps-activity-tab"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'history' && (
          history === null ? loadingList : history.length === 0 ? emptyText('ยังไม่มีประวัติสถานะ') : (
            <ol className="relative space-y-4 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-border">
              {history.map((h) => (
                <li key={h.id} className="relative flex gap-3 pl-0.5">
                  <span
                    className={cn(
                      'z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-2 ring-card',
                      h.toStatus === 'APPROVE' ? 'bg-emerald-500/15' : h.toStatus === 'REVIEW' ? 'bg-amber-500/15' : 'bg-sky-500/15',
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        h.toStatus === 'APPROVE' ? 'bg-emerald-500' : h.toStatus === 'REVIEW' ? 'bg-amber-500' : 'bg-sky-500',
                      )}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs">
                      <span className="font-medium">{STATUS_LABELS[h.toStatus]}</span>
                      {h.fromStatus && (
                        <span className="text-muted-foreground"> (จาก {STATUS_LABELS[h.fromStatus]})</span>
                      )}
                    </p>
                    {h.remark && <p className="text-[11px] text-muted-foreground">“{h.remark}”</p>}
                    <p className="text-[11px] text-muted-foreground">
                      {fullName(h.actor)} · {formatDateTime(h.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )
        )}

        {tab === 'actions' && (
          actions === null ? loadingList : actions.length === 0 ? emptyText('ยังไม่มีกิจกรรม') : (
            <ul className="space-y-3">
              {actions.map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <UserAvatar
                    avatarUrl={a.actionBy?.avatarUrl}
                    initial={(a.actionBy?.firstName?.[0] ?? '?').toUpperCase()}
                    color={a.actionRole === 'A_DXC' ? 'bg-fuchsia-500' : 'bg-violet-500'}
                    size="xs"
                  />
                  <div className="min-w-0">
                    <p className="text-xs">
                      <span className="font-medium">{fullName(a.actionBy)}</span>{' '}
                      <span className="font-mono text-[10px] text-muted-foreground">{a.actionType}</span>
                    </p>
                    {a.description && <p className="text-[11px] text-muted-foreground">{a.description}</p>}
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'audit' && (
          audit === null ? loadingList : audit.length === 0 ? emptyText('ยังไม่มี audit log') : (
            <ul className="space-y-3">
              {audit.map((log) => (
                <li key={log.id} className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <p className="text-xs">
                    <span className="font-mono text-[10px] font-medium">{log.action}</span>{' '}
                    <span className="text-muted-foreground">on</span>{' '}
                    <span className="font-mono text-[10px]">{log.tableName}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {fullName(log.createdBy)} · {formatDateTime(log.createdAt)}
                  </p>
                  {log.newValue && (
                    <pre className="mt-1 max-h-24 overflow-auto rounded bg-background/80 p-1.5 font-mono text-[10px] leading-snug text-muted-foreground">
                      {JSON.stringify(log.newValue, null, 1)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </CardContent>
    </Card>
  );
}
