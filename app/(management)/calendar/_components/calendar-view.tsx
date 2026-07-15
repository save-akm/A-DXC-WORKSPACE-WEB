'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  addDays,
  addMonths,
  formatDayTitle,
  formatMonthTitle,
  formatWeekTitle,
  monthGridWeeks,
  startOfWeek,
  timeToMinutes,
  toDateKey,
  weekDays,
} from '../_lib/date-utils';
import { mockEvents, mockProjects } from '../_mocks/mock-data';
import type { CalendarEvent, CalendarProject, CalendarView } from '../types';
import { MonthGrid } from './month-grid';
import { NewEventPopover } from './new-event-popover';
import { TimeGrid } from './time-grid';

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

let eventCounter = 0;

interface CalendarPageViewProps {
  initialView?: CalendarView;
}

export function CalendarPageView({ initialView = 'month' }: CalendarPageViewProps) {
  const [view, setView] = useState<CalendarView>(initialView);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const projectsById = useMemo(
    () => new Map<string, CalendarProject>(mockProjects.map((p) => [p.id, p])),
    [],
  );

  // group ตามวัน + เรียง: ทั้งวัน (due date) มาก่อน แล้วตามเวลาเริ่ม
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      if (hiddenProjects.has(event.projectId)) continue;
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (!a.startTime && !b.startTime) return a.title.localeCompare(b.title, 'th');
        if (!a.startTime) return -1;
        if (!b.startTime) return 1;
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      });
    }
    return map;
  }, [events, hiddenProjects]);

  const weeks = useMemo(() => monthGridWeeks(cursor), [cursor]);
  const days = useMemo(
    () => (view === 'week' ? weekDays(cursor) : [cursor]),
    [view, cursor],
  );

  const title =
    view === 'month'
      ? formatMonthTitle(cursor)
      : view === 'week'
        ? formatWeekTitle(cursor)
        : formatDayTitle(cursor);

  const navigate = (dir: -1 | 1) => {
    setCursor((c) =>
      view === 'month' ? addMonths(c, dir) : view === 'week' ? addDays(c, dir * 7) : addDays(c, dir),
    );
  };

  const openDay = (day: Date) => {
    setCursor(new Date(day));
    setView('day');
  };

  const toggleProject = (id: string) => {
    setHiddenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createEvent = (input: Omit<CalendarEvent, 'id'>) => {
    const event: CalendarEvent = { ...input, id: `evt_${Date.now()}_${eventCounter++}` };
    setEvents((prev) => [...prev, event]);
    toast.success('สร้าง event แล้ว', { description: event.title });
  };

  const deleteEvent = (id: string) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success('ลบ event แล้ว', {
      description: target.title,
      action: { label: 'เลิกทำ', onClick: () => setEvents((prev) => [...prev, target]) },
    });
  };

  // key ของ animation: เปลี่ยนทั้ง view และช่วงเวลา → fade สั้นๆ
  const gridKey =
    view === 'month'
      ? `month-${cursor.getFullYear()}-${cursor.getMonth()}`
      : view === 'week'
        ? `week-${toDateKey(startOfWeek(cursor))}`
        : `day-${toDateKey(cursor)}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:p-6">
        <h1 className="sr-only">Calendar</h1>

        {/* Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="ช่วงก่อนหน้า" onClick={() => navigate(-1)}>
              <ChevronLeft size={15} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="ช่วงถัดไป" onClick={() => navigate(1)}>
              <ChevronRight size={15} />
            </Button>
          </div>
          <p className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground tabular-nums">
            {title}
          </p>
          <Button variant="outline" size="sm" onClick={() => setCursor(today)}>
            Today
          </Button>

          <div className="ms-auto flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Month / Week / Day */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
              {VIEWS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setView(v.value)}
                  className={cn(
                    'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    view === v.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {view === v.value && (
                    <motion.span
                      layoutId="calendar-view-tab-bg"
                      className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {v.label}
                </button>
              ))}
            </div>

            {/* Legend — กดเพื่อซ่อน/แสดงโปรเจกต์ */}
            <div className="hidden items-center gap-1 md:flex">
              {mockProjects.map((p) => {
                const off = hiddenProjects.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProject(p.id)}
                    aria-pressed={!off}
                    title={off ? `แสดง ${p.name}` : `ซ่อน ${p.name}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted/70',
                      off ? 'text-muted-foreground/60' : 'text-muted-foreground',
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full transition-colors"
                      style={
                        off
                          ? { boxShadow: `inset 0 0 0 1.5px ${p.color}` }
                          : { backgroundColor: p.color }
                      }
                    />
                    {p.name}
                  </button>
                );
              })}
            </div>

            <NewEventPopover
              projects={mockProjects}
              defaultDate={toDateKey(cursor)}
              onCreate={createEvent}
            />
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={gridKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {view === 'month' ? (
              <MonthGrid
                weeks={weeks}
                cursor={cursor}
                today={today}
                eventsByDay={eventsByDay}
                projectsById={projectsById}
                onDeleteEvent={deleteEvent}
                onSelectDay={openDay}
              />
            ) : (
              <TimeGrid
                days={days}
                today={today}
                eventsByDay={eventsByDay}
                projectsById={projectsById}
                onDeleteEvent={deleteEvent}
                onSelectDay={openDay}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
