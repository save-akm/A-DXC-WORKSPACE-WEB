'use client';

import { useEffect, useState } from 'react';
import { Globe, Monitor, MapPin, Smartphone, AlertCircle, User as UserIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { fetchLoginLog } from '@/lib/api/audit';
import { formatLogFull, failureReasonLabel } from '@/lib/audit/format';
import type { LoginLog } from '@/lib/audit/types';
import {
  StatusBadge,
  CopyButton,
  InitialAvatar,
  MetaRow,
  Mono,
} from '../../_components/log-ui';

interface Props {
  /** Row from the list — shown instantly while the detail request refreshes it. */
  row: LoginLog | null;
  open: boolean;
  onClose: () => void;
}

function fullName(log: LoginLog): string | null {
  if (!log.user) return null;
  const name = [log.user.firstName, log.user.lastName].filter(Boolean).join(' ').trim();
  return name || log.user.email;
}

export function LoginDetailSheet({ row, open, onClose }: Props) {
  const [log, setLog] = useState<LoginLog | null>(row);

  useEffect(() => {
    setLog(row);
    if (!row || !open) return;
    let active = true;
    fetchLoginLog(row.id)
      .then((full) => { if (active) setLog(full); })
      .catch(() => { /* fields match the list row — keep it as fallback */ });
    return () => { active = false; };
  }, [row, open]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {log && (
          <>
            <SheetHeader className="gap-2 border-b p-5 pr-14">
              <SheetTitle className="truncate text-base">{log.identifier}</SheetTitle>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <StatusBadge status={log.status} />
                <SheetDescription className="text-xs">{formatLogFull(log.createdAt)}</SheetDescription>
              </div>
            </SheetHeader>

            <div className="space-y-6 p-5">
              {/* Failure reason banner */}
              {log.status !== 'SUCCESS' && log.failureReason && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{failureReasonLabel(log.failureReason)}</p>
                    <Mono className="text-rose-600/70 dark:text-rose-400/70">{log.failureReason}</Mono>
                  </div>
                </div>
              )}

              {/* Linked account */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">บัญชี</h3>
                {log.user ? (
                  <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <InitialAvatar name={fullName(log)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{fullName(log)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {log.user.email}
                        {log.user.employeeId ? ` · ${log.user.employeeId}` : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UserIcon className="size-3.5" /> ไม่พบบัญชีที่ตรงกับ identifier นี้
                  </p>
                )}
              </section>

              {/* Origin */}
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ที่มา</h3>
                <dl className="divide-y">
                  <MetaRow label="IP Address">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="size-3.5 text-muted-foreground" />
                      <Mono>{log.ipAddress ?? '—'}</Mono>
                      {log.ipAddress && <CopyButton value={log.ipAddress} />}
                    </span>
                  </MetaRow>
                  <MetaRow label="ตำแหน่ง">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {log.location ?? '—'}
                    </span>
                  </MetaRow>
                  <MetaRow label="อุปกรณ์">
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="size-3.5 text-muted-foreground" />
                      {log.deviceType ?? '—'}
                    </span>
                  </MetaRow>
                  <MetaRow label="เบราว์เซอร์">{log.browser ?? '—'}</MetaRow>
                  <MetaRow label="ระบบปฏิบัติการ">{log.os ?? '—'}</MetaRow>
                  <MetaRow label="User Agent">
                    <span className="inline-flex items-start gap-1.5">
                      <Monitor className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{log.userAgent ?? '—'}</span>
                    </span>
                  </MetaRow>
                </dl>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
