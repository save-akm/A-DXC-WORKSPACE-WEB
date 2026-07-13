'use client';

import { useEffect, useRef } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastData, type ToastVariant } from './toast-store';

interface VariantStyle {
  strip: string;
  headerBg: string;
  icon: LucideIcon | null;
  iconCls: string;
  glow: string;
  progress: string;
  label: string;
}

const variantStyles: Record<ToastVariant, VariantStyle> = {
  success: {
    strip: 'before:bg-emerald-500',
    headerBg: 'bg-emerald-500/[0.06]',
    icon: CheckCircle2,
    iconCls: 'text-emerald-500',
    glow: 'shadow-emerald-500/10',
    progress: 'bg-emerald-500',
    label: 'สำเร็จ',
  },
  error: {
    strip: 'before:bg-destructive',
    headerBg: 'bg-destructive/[0.06]',
    icon: XCircle,
    iconCls: 'text-destructive',
    glow: 'shadow-destructive/10',
    progress: 'bg-destructive',
    label: 'ข้อผิดพลาด',
  },
  warning: {
    strip: 'before:bg-amber-500',
    headerBg: 'bg-amber-500/[0.06]',
    icon: AlertTriangle,
    iconCls: 'text-amber-500',
    glow: 'shadow-amber-500/10',
    progress: 'bg-amber-500',
    label: 'คำเตือน',
  },
  info: {
    strip: 'before:bg-sky-500',
    headerBg: 'bg-sky-500/[0.06]',
    icon: Info,
    iconCls: 'text-sky-500',
    glow: 'shadow-sky-500/10',
    progress: 'bg-sky-500',
    label: 'ข้อมูล',
  },
  loading: {
    strip: 'before:bg-violet-500',
    headerBg: 'bg-violet-500/[0.06]',
    icon: Loader2,
    iconCls: 'text-violet-500 animate-spin',
    glow: 'shadow-violet-500/10',
    progress: 'bg-violet-500',
    label: 'กำลังดำเนินการ',
  },
  default: {
    strip: 'before:bg-border',
    headerBg: 'bg-muted/40',
    icon: null,
    iconCls: '',
    glow: '',
    progress: 'bg-border',
    label: 'แจ้งเตือน',
  },
};

function formatDateTime(ts: number): { time: string; date: string } {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const date = d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return { time, date };
}

interface ToastItemProps {
  toast: ToastData;
  index: number;
  expanded: boolean;
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
  onMeasure: (id: string, height: number) => void;
}

export function ToastItem({
  toast,
  index,
  expanded,
  y,
  scale,
  opacity,
  zIndex,
  onMeasure,
}: ToastItemProps) {
  const dismiss = useToastStore((s) => s.dismiss);
  const ref = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  pausedRef.current = expanded;

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const report = () => onMeasure(toast.id, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [toast.id, onMeasure]);

  useEffect(() => {
    if (toast.variant === 'loading') return;
    if (expanded) return;
    if (!toast.duration || toast.duration <= 0) return;
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, toast.variant, expanded, dismiss]);

  const style = variantStyles[toast.variant];
  const Icon = style.icon;
  const { time, date } = formatDateTime(toast.createdAt);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 80 || info.velocity.x > 600) {
      dismiss(toast.id);
    }
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity, y, scale, zIndex }}
      exit={{ opacity: 0, x: 120, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
      drag="x"
      dragConstraints={{ left: -20, right: 200 }}
      dragElastic={{ left: 0.1, right: 0.5 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      style={{ zIndex, transformOrigin: 'bottom right' }}
      className={cn(
        'pointer-events-auto absolute bottom-0 right-0 w-full cursor-grab select-none',
        'overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground',
        'shadow-2xl backdrop-blur-md',
        'before:absolute before:inset-y-0 before:left-0 before:w-1',
        style.strip,
        style.glow,
      )}
    >
      {/* Header row */}
      <div className={cn('flex items-center justify-between gap-2 px-4 py-2 pl-5', style.headerBg)}>
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className={cn('size-3.5 shrink-0', style.iconCls)} />}
          <span className="text-xs font-semibold text-foreground truncate">
            {style.label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 text-xs tabular-nums font-semibold text-muted-foreground/80">
            <Clock className="size-3" />
            <span>{time}</span>
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-2.5 pl-5">
        <p className="text-sm font-semibold leading-snug text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {toast.description}
          </p>
        )}

        {/* Footer: date + action */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground/60">{date}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => { toast.action?.onClick(); dismiss(toast.id); }}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {toast.variant !== 'loading' && toast.duration > 0 && !expanded && index === 0 && (
        <motion.div
          key={`${toast.id}-progress`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
          className={cn('h-0.5 w-full', style.progress)}
        />
      )}
    </motion.div>
  );
}
