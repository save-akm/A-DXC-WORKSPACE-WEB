'use client';

import { useEffect, useState } from 'react';
import { Monitor, Globe, Hash, Boxes } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { fetchAuditLog } from '@/lib/api/audit';
import { formatLogFull } from '@/lib/audit/format';
import type { AuditLog } from '@/lib/audit/types';
import {
  ActionBadge,
  ChangesView,
  CopyButton,
  FieldDiff,
  InitialAvatar,
  JsonView,
  MetaRow,
  Mono,
} from '../../_components/log-ui';

interface Props {
  /** Row already in hand from the list — shown instantly while detail loads. */
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

export function AuditDetailSheet({ log, open, onClose }: Props) {
  const [detail, setDetail] = useState<AuditLog | null>(log);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDetail(log);
    if (!log || !open) return;
    let active = true;
    setLoading(true);
    fetchAuditLog(log.id)
      .then((full) => { if (active) setDetail(full); })
      .catch(() => { /* keep the list row as fallback */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [log, open]);

  const data = detail ?? log;
  const actor = data?.actor;
  const hasActor = !!(actor && (actor.id || actor.name || actor.email));
  const hasChanges = !!(data?.changes && data.changes.length > 0);
  const hasSnapshot = !!(data && (data.before || data.after));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {data && (
          <>
            <SheetHeader className="gap-2 border-b p-5 pr-14">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Mono className="text-sm">#{data.id}</Mono>
                <CopyButton value={data.id} />
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <ActionBadge action={data.action} />
                {loading && <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />}
                <SheetDescription className="text-xs">{formatLogFull(data.createdAt)}</SheetDescription>
              </div>
            </SheetHeader>

            <div className="space-y-6 p-5">
              {/* Actor */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ผู้กระทำ</h3>
                {hasActor ? (
                  <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <InitialAvatar name={actor!.name ?? actor!.email} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{actor!.name ?? actor!.email ?? '—'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {actor!.email}
                        {actor!.employeeId ? ` · ${actor!.employeeId}` : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">ระบบ (ไม่มีผู้กระทำ)</p>
                )}
              </section>

              {/* Target / request */}
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">เป้าหมาย & คำขอ</h3>
                <dl className="divide-y">
                  <MetaRow label="Entity">
                    <span className="inline-flex items-center gap-1.5">
                      <Boxes className="size-3.5 text-muted-foreground" />
                      {data.entityType ?? '—'}
                    </span>
                  </MetaRow>
                  <MetaRow label="Entity ID">
                    {data.entityId ? (
                      <span className="inline-flex items-center gap-1">
                        <Hash className="size-3.5 text-muted-foreground" />
                        <Mono>{data.entityId}</Mono>
                        <CopyButton value={data.entityId} />
                      </span>
                    ) : '—'}
                  </MetaRow>
                  <MetaRow label="IP Address">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <Mono>{data.ipAddress ?? '—'}</Mono>
                    </span>
                  </MetaRow>
                  <MetaRow label="User Agent">
                    <span className="inline-flex items-start gap-1.5">
                      <Monitor className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{data.userAgent ?? '—'}</span>
                    </span>
                  </MetaRow>
                </dl>
              </section>

              {/* Changes */}
              {(hasChanges || hasSnapshot) && (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    การเปลี่ยนแปลง
                    {data.changeCount > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {data.changeCount} ฟิลด์
                      </span>
                    )}
                  </h3>
                  {hasChanges
                    ? <ChangesView changes={data.changes!} />
                    : <FieldDiff before={data.before ?? null} after={data.after ?? null} />}
                </section>
              )}

              {/* Metadata */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metadata</h3>
                <JsonView data={data.metadata} />
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
