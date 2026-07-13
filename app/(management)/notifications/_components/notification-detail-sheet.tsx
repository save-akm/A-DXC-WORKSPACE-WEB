'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, Boxes, CalendarClock, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fullDateTime } from '@/lib/notifications/meta';
import type { InboxItem } from '@/lib/notifications/types';
import { IconChip, PriorityBadge, TypeBadge } from './notification-bits';

interface Props {
  item: InboxItem | null;
  open: boolean;
  onClose: () => void;
  onDismiss: (recipientId: string) => void;
}

export function NotificationDetailSheet({ item, open, onClose, onDismiss }: Props) {
  const router = useRouter();
  const n = item?.notification;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        {item && n && (
          <>
            <SheetHeader className="gap-3 border-b p-5 pr-14">
              <div className="flex items-start gap-3">
                <IconChip icon={n.icon} type={n.type} />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base leading-snug text-foreground">
                    {n.header}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs">
                    {fullDateTime(n.sentAt ?? n.createdAt)}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <TypeBadge type={n.type} />
                <PriorityBadge priority={n.priority} />
                {!item.isRead && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-[11px] font-medium text-brand">
                    <span className="size-1.5 rounded-full bg-brand" />
                    ยังไม่ได้อ่าน
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-6 p-5">
              {/* Body */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {n.detail}
              </p>

              {/* Action */}
              {n.actionUrl && (
                <Button
                  variant="create"
                  className="w-full"
                  onClick={() => {
                    onClose();
                    router.push(n.actionUrl!);
                  }}
                >
                  ไปยังหน้าที่เกี่ยวข้อง
                  <ArrowUpRight />
                </Button>
              )}

              {/* Meta */}
              <dl className="divide-y rounded-xl border bg-muted/20">
                <MetaRow label="ส่งเมื่อ">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-3.5 text-muted-foreground" />
                    {fullDateTime(n.sentAt ?? n.createdAt)}
                  </span>
                </MetaRow>
                {n.sourceType && (
                  <MetaRow label="แหล่งที่มา">
                    <span className="inline-flex items-center gap-1.5">
                      <Boxes className="size-3.5 text-muted-foreground" />
                      {n.sourceType}
                    </span>
                  </MetaRow>
                )}
                {item.readAt && <MetaRow label="อ่านเมื่อ">{fullDateTime(item.readAt)}</MetaRow>}
                {n.expiresAt && (
                  <MetaRow label="หมดอายุ">
                    <span className="text-amber-600 dark:text-amber-400">{fullDateTime(n.expiresAt)}</span>
                  </MetaRow>
                )}
              </dl>

              {/* Dismiss */}
              <button
                type="button"
                onClick={() => {
                  onDismiss(item.id);
                  onClose();
                }}
                className={cn(
                  'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5',
                  'text-sm font-medium text-muted-foreground transition-colors hover:border-rose-300 hover:bg-rose-500/5 hover:text-rose-600 dark:hover:border-rose-500/40 dark:hover:text-rose-400',
                )}
              >
                <Trash2 className="size-4" />
                ลบการแจ้งเตือนนี้
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 px-3.5 py-2.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}
