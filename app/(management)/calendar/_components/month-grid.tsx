'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { isSameDay, toDateKey, WEEKDAYS_SHORT } from '../_lib/date-utils';
import type { CalendarEvent, CalendarProject } from '../types';
import { EventChipContent, eventChipTriggerClass as chipTriggerClass, EventPopover } from './event-item';

/** จำนวน event สูงสุดที่โชว์ต่อช่องก่อนพับเป็น "+N more" */
const MAX_VISIBLE = 3;

interface MonthGridProps {
  weeks: Date[][];
  /** เดือนที่กำลังดู (ใช้แยกช่องนอกเดือน) */
  cursor: Date;
  today: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  projectsById: Map<string, CalendarProject>;
  onDeleteEvent: (id: string) => void;
  /** กดเลขวัน → เปิด day view ของวันนั้น */
  onSelectDay: (day: Date) => void;
}

export function MonthGrid({
  weeks,
  cursor,
  today,
  eventsByDay,
  projectsById,
  onDeleteEvent,
  onSelectDay,
}: MonthGridProps) {
  return (
    <div className="flex-1 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
      <div className="flex min-h-full min-w-176 flex-col rounded-xl bg-card ring-1 ring-foreground/10">
        {/* หัวคอลัมน์วันในสัปดาห์ */}
        <div className="grid shrink-0 grid-cols-7 border-b border-border/70">
          {WEEKDAYS_SHORT.map((label) => (
            <div
              key={label}
              className="px-2.5 py-2 font-mono text-[0.6875rem] font-medium tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className="grid flex-1 grid-cols-7"
          style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(6.75rem, 1fr))` }}
        >
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const key = toDateKey(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = isSameDay(day, today);
              const events = eventsByDay.get(key) ?? [];
              const visible = events.slice(0, MAX_VISIBLE);
              const overflow = events.length - visible.length;

              return (
                <div
                  key={key}
                  className={cn(
                    'flex min-w-0 flex-col gap-0.5 border-border/70 p-1 pt-1.5',
                    di < 6 && 'border-e',
                    wi < weeks.length - 1 && 'border-b',
                    !inMonth && 'bg-muted/30',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    aria-label={`ดูวันที่ ${day.getDate()} แบบรายวัน`}
                    className={cn(
                      'ms-1 flex size-6 shrink-0 cursor-pointer items-center justify-center self-start rounded-full text-xs tabular-nums transition-colors',
                      isToday
                        ? 'bg-brand font-semibold text-brand-foreground'
                        : inMonth
                          ? 'text-foreground hover:bg-muted'
                          : 'text-muted-foreground/70 hover:bg-muted',
                    )}
                  >
                    {day.getDate()}
                  </button>

                  {visible.map((event) => {
                    const project = projectsById.get(event.projectId);
                    if (!project) return null;
                    return (
                      <EventPopover
                        key={event.id}
                        event={event}
                        project={project}
                        onDelete={onDeleteEvent}
                        triggerClassName={chipTriggerClass}
                      >
                        <EventChipContent event={event} project={project} dimmed={!inMonth} />
                      </EventPopover>
                    );
                  })}

                  {overflow > 0 && (
                    <Popover>
                      <PopoverTrigger className="ms-1.5 cursor-pointer self-start rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                        +{overflow} more
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80">
                        <p className="text-xs font-medium text-muted-foreground">
                          ทั้งหมดของวันที่ {day.getDate()} ({events.length} รายการ)
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {events.map((event) => {
                            const project = projectsById.get(event.projectId);
                            if (!project) return null;
                            return (
                              <EventPopover
                                key={event.id}
                                event={event}
                                project={project}
                                onDelete={onDeleteEvent}
                                triggerClassName={chipTriggerClass}
                              >
                                <EventChipContent event={event} project={project} />
                              </EventPopover>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
