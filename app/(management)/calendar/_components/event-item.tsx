'use client';

import { CalendarDays, Clock, StickyNote, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDayTitle, parseDateKey } from '../_lib/date-utils';
import type { CalendarEvent, CalendarProject } from '../types';

interface EventChipContentProps {
  event: CalendarEvent;
  project: CalendarProject;
  /** ลดความเด่นของ event ที่อยู่นอกเดือนปัจจุบัน (month view) */
  dimmed?: boolean;
}

/** เนื้อในของ chip แถว event ใน month grid — dot สีโปรเจกต์ + key + ชื่อ + เวลา */
export function EventChipContent({ event, project, dimmed }: EventChipContentProps) {
  return (
    <span className={cn('flex w-full min-w-0 items-center gap-1.5', dimmed && 'opacity-50')}>
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: project.color }}
      />
      {event.issueKey && (
        <span className="shrink-0 rounded-sm bg-muted px-1 font-mono text-[0.6875rem] leading-4 text-muted-foreground">
          {event.issueKey}
        </span>
      )}
      <span className="truncate text-xs text-foreground/90">{event.title}</span>
      {event.startTime && (
        <span className="ml-auto shrink-0 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
          {event.startTime}
        </span>
      )}
    </span>
  );
}

interface EventDetailProps {
  event: CalendarEvent;
  project: CalendarProject;
  onDelete: (id: string) => void;
}

/** เนื้อหา popover รายละเอียด event — ใช้ร่วมกันทุก view */
export function EventDetail({ event, project, onDelete }: EventDetailProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-1.5 size-2 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-foreground">{event.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {project.name}
            {event.issueKey && (
              <span className="ml-1.5 rounded-sm bg-muted px-1 py-px font-mono">{event.issueKey}</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={13} className="shrink-0" />
          {formatDayTitle(parseDateKey(event.date))}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="shrink-0" />
          {event.startTime
            ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''} น.`
            : 'ทั้งวัน (due date)'}
        </span>
        {event.note && (
          <span className="flex items-start gap-1.5">
            <StickyNote size={13} className="mt-0.5 shrink-0" />
            <span className="min-w-0">{event.note}</span>
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="destructive" size="xs" onClick={() => onDelete(event.id)}>
          <Trash2 />
          ลบ event
        </Button>
      </div>
    </div>
  );
}

/** trigger มาตรฐานของ chip ใน month grid / all-day row */
export const eventChipTriggerClass =
  'flex w-full cursor-pointer items-center rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring';

interface EventPopoverProps {
  event: CalendarEvent;
  project: CalendarProject;
  onDelete: (id: string) => void;
  /** trigger ที่จะถูก render เป็น <button> (className/style ส่งผ่านได้) */
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/** ครอบ chip/block ใดๆ ให้กดแล้วเปิดรายละเอียด event */
export function EventPopover({
  event,
  project,
  onDelete,
  triggerClassName,
  triggerStyle,
  children,
}: EventPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger className={triggerClassName} style={triggerStyle}>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <EventDetail event={event} project={project} onDelete={onDelete} />
      </PopoverContent>
    </Popover>
  );
}
