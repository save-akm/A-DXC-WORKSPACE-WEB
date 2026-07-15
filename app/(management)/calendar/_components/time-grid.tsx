'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { isSameDay, timeToMinutes, toDateKey, WEEKDAYS_SHORT } from '../_lib/date-utils';
import type { CalendarEvent, CalendarProject } from '../types';
import { EventChipContent, eventChipTriggerClass, EventPopover } from './event-item';

/** ช่วงเวลาที่แสดงในตาราง: 07:00 – 20:00 */
const START_HOUR = 7;
const END_HOUR = 20;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
/** ความสูงต่อชั่วโมง (rem) */
const HOUR_REM = 3.5;

const pctOf = (minutes: number) =>
  `${((minutes - START_HOUR * 60) / TOTAL_MIN) * 100}%`;

/** เส้นบอกเวลาปัจจุบัน — render หลัง mount เท่านั้น (เลี่ยง hydration mismatch) */
function NowIndicator() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10" style={{ top: pctOf(minutes) }}>
      <div className="relative h-0.5 bg-brand">
        <span className="absolute -inset-s-1 -top-0.75 size-2 rounded-full bg-brand" />
      </div>
    </div>
  );
}

interface TimeGridProps {
  /** 7 วัน (week view) หรือ 1 วัน (day view) */
  days: Date[];
  today: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  projectsById: Map<string, CalendarProject>;
  onDeleteEvent: (id: string) => void;
  onSelectDay: (day: Date) => void;
}

export function TimeGrid({ days, today, eventsByDay, projectsById, onDeleteEvent, onSelectDay }: TimeGridProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const isWeek = days.length > 1;
  const columns = `4rem repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="flex-1 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
      <div className={cn('flex min-h-full flex-col rounded-xl bg-card ring-1 ring-foreground/10', isWeek && 'min-w-176')}>
        {/* หัวคอลัมน์: วัน + เลขวันที่ */}
        <div className="grid border-b border-border/70" style={{ gridTemplateColumns: columns }}>
          <div />
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <button
                key={toDateKey(day)}
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={`ดูวันที่ ${day.getDate()} แบบรายวัน`}
                className="group flex cursor-pointer items-center gap-2 border-s border-border/50 px-2.5 py-2 text-start transition-colors hover:bg-muted/40"
              >
                <span className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground">
                  {WEEKDAYS_SHORT[day.getDay()]}
                </span>
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                    isToday ? 'bg-brand font-semibold text-brand-foreground' : 'text-foreground',
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* แถว all-day (due date ของ issue ฯลฯ) */}
        <div className="grid border-b border-border/70" style={{ gridTemplateColumns: columns }}>
          <div className="whitespace-nowrap px-2 py-1.5 text-end font-mono text-[0.6875rem] text-muted-foreground">
            all-day
          </div>
          {days.map((day) => {
            const allDay = (eventsByDay.get(toDateKey(day)) ?? []).filter((e) => !e.startTime);
            return (
              <div
                key={toDateKey(day)}
                className="flex min-h-8 min-w-0 flex-col gap-0.5 border-s border-border/50 p-1"
              >
                {allDay.map((event) => {
                  const project = projectsById.get(event.projectId);
                  if (!project) return null;
                  return (
                    <EventPopover
                      key={event.id}
                      event={event}
                      project={project}
                      onDelete={onDeleteEvent}
                      triggerClassName={eventChipTriggerClass}
                    >
                      <EventChipContent event={event} project={project} />
                    </EventPopover>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ตารางชั่วโมง */}
        <div className="grid flex-1" style={{ gridTemplateColumns: columns }}>
          {/* เลขชั่วโมง */}
          <div className="relative" style={{ minHeight: `${(END_HOUR - START_HOUR) * HOUR_REM}rem` }}>
            {hours.map((h) => (
              <span
                key={h}
                className="absolute inset-e-2 -translate-y-1/2 font-mono text-[0.6875rem] text-muted-foreground tabular-nums"
                style={{ top: pctOf(h * 60) }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {days.map((day) => {
            const timed = (eventsByDay.get(toDateKey(day)) ?? []).filter((e) => e.startTime);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={toDateKey(day)}
                className={cn('relative border-s border-border/50', isToday && 'bg-brand-muted/40')}
                style={{ minHeight: `${(END_HOUR - START_HOUR) * HOUR_REM}rem` }}
              >
                {/* เส้นแบ่งชั่วโมง */}
                {hours.slice(1).map((h) => (
                  <div
                    key={h}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-border/40"
                    style={{ top: pctOf(h * 60) }}
                  />
                ))}

                {isToday && <NowIndicator />}

                {timed.map((event) => {
                  const project = projectsById.get(event.projectId);
                  if (!project || !event.startTime) return null;
                  const start = Math.max(timeToMinutes(event.startTime), START_HOUR * 60);
                  const end = Math.min(
                    event.endTime ? timeToMinutes(event.endTime) : start + 60,
                    END_HOUR * 60,
                  );
                  const heightPct = ((Math.max(end - start, 25) / TOTAL_MIN) * 100).toFixed(3);
                  // block เตี้ยกว่า ~45 นาที มีที่พอบรรทัดเดียว → ชื่อ + เวลาแถวเดียวกัน
                  const compact = end - start < 45;
                  return (
                    <EventPopover
                      key={event.id}
                      event={event}
                      project={project}
                      onDelete={onDeleteEvent}
                      triggerClassName={cn(
                        'absolute inset-x-1 z-1 flex cursor-pointer overflow-hidden rounded-md px-1.5 text-start ring-1 transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ring',
                        compact ? 'flex-row items-center gap-1.5 py-0' : 'flex-col py-1',
                      )}
                      triggerStyle={{
                        top: pctOf(start),
                        height: `${heightPct}%`,
                        backgroundColor: `color-mix(in oklch, ${project.color} 16%, transparent)`,
                        // ring-1 ใช้ box-shadow — คุมสีผ่าน CSS var ของ tailwind
                        ['--tw-ring-color' as string]: `color-mix(in oklch, ${project.color} 38%, transparent)`,
                      }}
                    >
                      <span className="truncate text-xs font-medium text-foreground">{event.title}</span>
                      <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
                        {event.startTime}
                        {event.endTime && ` – ${event.endTime}`}
                      </span>
                    </EventPopover>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
