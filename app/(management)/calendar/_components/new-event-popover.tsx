'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarProject } from '../types';

interface NewEventPopoverProps {
  projects: CalendarProject[];
  /** วันที่ตั้งต้นของฟอร์ม (ตามวันที่กำลังดูอยู่) */
  defaultDate: string;
  onCreate: (event: Omit<CalendarEvent, 'id'>) => void;
}

export function NewEventPopover({ projects, defaultDate, onCreate }: NewEventPopoverProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const canSubmit = title.trim().length > 0 && projectId && date;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setDate(defaultDate); // เปิดใหม่ทีไร ตั้งวันที่ตามหน้าที่ดูอยู่
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({
      title: title.trim(),
      projectId,
      date,
      startTime: startTime || undefined,
      endTime: startTime && endTime ? endTime : undefined,
    });
    setTitle('');
    setStartTime('');
    setEndTime('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'create' }), 'shrink-0 cursor-pointer')}>
        <Plus size={14} />
        <span className="hidden sm:inline">New event</span>
        <span className="sm:hidden">New</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">สร้าง event ใหม่</p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-event-title">ชื่อ event</Label>
            <Input
              id="cal-event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Sprint review"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-event-project">โปรเจกต์</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="cal-event-project" size="sm">
                <SelectValue placeholder="เลือกโปรเจกต์" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-event-date">วันที่</Label>
            <Input
              id="cal-event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-event-start">เริ่ม (ไม่ใส่ = ทั้งวัน)</Label>
              <Input
                id="cal-event-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-event-end">สิ้นสุด</Label>
              <Input
                id="cal-event-end"
                type="time"
                value={endTime}
                min={startTime || undefined}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!startTime}
              />
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="cancel" size="sm" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="save" size="sm" disabled={!canSubmit}>
              บันทึก
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
