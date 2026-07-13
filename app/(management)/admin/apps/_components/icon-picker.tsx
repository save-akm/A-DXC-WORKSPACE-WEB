'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';

const POPULAR_ICONS = [
  // People & HR
  'Users', 'UserCheck', 'UserPlus', 'User', 'Contact',
  // Buildings & Places
  'Building2', 'Home', 'MapPin', 'Map', 'Globe',
  // Calendar & Time
  'Calendar', 'CalendarDays', 'Clock', 'AlarmClock',
  // Communication
  'Mail', 'Phone', 'MessageSquare', 'Bell', 'Headphones',
  // Files & Docs
  'FileText', 'File', 'Clipboard', 'ClipboardList', 'FolderOpen', 'Folder', 'BookOpen', 'Book',
  // Finance
  'DollarSign', 'CreditCard', 'Calculator', 'TrendingUp', 'Wallet', 'Receipt',
  // Charts
  'BarChart2', 'PieChart', 'LineChart', 'Activity',
  // Logistics
  'Package', 'Truck', 'ShoppingCart', 'Layers',
  // Security
  'Shield', 'ShieldCheck', 'Lock', 'Key', 'Flag',
  // IT
  'Database', 'Monitor', 'Cpu', 'Server', 'Code', 'Terminal', 'Wifi', 'Cloud',
  // Settings
  'Settings', 'Settings2', 'Wrench', 'Briefcase', 'Star', 'Award',
  // Status & Alerts
  'Megaphone', 'TriangleAlert', 'CircleAlert', 'Info', 'CircleCheck', 'CircleX', 'Siren', 'BellRing', 'Zap', 'Sparkles', 'Flame',
  // Events & Celebration
  'PartyPopper', 'Gift', 'Ticket', 'Cake', 'Trophy',
  // Actions & Tools
  'Download', 'Upload', 'RefreshCw', 'Eye', 'Share2', 'Link', 'ExternalLink', 'ListFilter', 'Pencil', 'Trash2',
  // Media
  'Image', 'Video', 'Camera', 'Mic', 'CirclePlay', 'Music',
  // Education & Knowledge
  'GraduationCap', 'Lightbulb', 'Target', 'Newspaper',
  // Health & Wellbeing
  'Heart', 'HeartPulse', 'Stethoscope', 'Coffee', 'Utensils',
  // Transportation
  'Car', 'Plane', 'TrainFront', 'Bus', 'Bike',
];

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
  /** Size of the trigger button */
  size?: 'sm' | 'md';
}

export function IconPicker({ value, onChange, size = 'md' }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => { setMounted(true); }, []);

  function openPicker() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverH = 230;
    setCoords({
      top: spaceBelow >= popoverH ? rect.bottom + 6 : rect.top - popoverH - 6,
      left: Math.min(rect.left, window.innerWidth - 264),
    });
    setSearch('');
    setOpen(true);
  }

  const filtered = search.trim()
    ? POPULAR_ICONS.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : POPULAR_ICONS;

  const triggerCls = size === 'sm'
    ? 'h-7 w-7'
    : 'h-9 w-9';
  const iconCls = size === 'sm'
    ? 'h-3.5 w-3.5'
    : 'h-4 w-4';

  const popover = open && mounted && createPortal(
    <>
      {/* Invisible backdrop to close on outside click */}
      <div
        className="fixed inset-0 z-9998"
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed z-9999 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
        style={{ top: coords.top, left: coords.left }}
      >
        {/* Search */}
        <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-2">
          <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาไอคอน…"
            className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        {/* Grid */}
        <div className="max-h-[180px] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-muted-foreground">ไม่พบไอคอน</p>
          ) : (
            <div className="grid grid-cols-8 gap-0.5">
              {/* None option */}
              <button
                type="button"
                title="ไม่มีไอคอน"
                onClick={() => { onChange(null); setOpen(false); }}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-bold text-muted-foreground transition-colors hover:bg-muted',
                  !value && 'bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/50',
                )}
              >
                —
              </button>

              {filtered.map(name => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => { onChange(name); setOpen(false); }}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-muted',
                    value === name && 'bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/50 text-indigo-500',
                  )}
                >
                  <AppIcon name={name} className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="เลือกไอคอน"
        onClick={openPicker}
        className={cn(
          'flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background transition-colors hover:border-indigo-400/60 hover:bg-muted/60',
          open && 'border-indigo-400/60 bg-muted/60',
          triggerCls,
        )}
      >
        <AppIcon name={value} className={cn('text-muted-foreground', iconCls)} />
      </button>
      {popover}
    </>
  );
}
