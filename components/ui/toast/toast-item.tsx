'use client';

import { useEffect, useRef } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
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
  icon: LucideIcon | null;
  iconCls: string;
  glow: string;
  progress: string;
}

const variantStyles: Record<ToastVariant, VariantStyle> = {
  success: {
    strip: 'before:bg-emerald-500',
    icon: CheckCircle2,
    iconCls: 'text-emerald-500',
    glow: 'shadow-emerald-500/10',
    progress: 'bg-emerald-500',
  },
  error: {
    strip: 'before:bg-destructive',
    icon: XCircle,
    iconCls: 'text-destructive',
    glow: 'shadow-destructive/10',
    progress: 'bg-destructive',
  },
  warning: {
    strip: 'before:bg-amber-500',
    icon: AlertTriangle,
    iconCls: 'text-amber-500',
    glow: 'shadow-amber-500/10',
    progress: 'bg-amber-500',
  },
  info: {
    strip: 'before:bg-sky-500',
    icon: Info,
    iconCls: 'text-sky-500',
    glow: 'shadow-sky-500/10',
    progress: 'bg-sky-500',
  },
  loading: {
    strip: 'before:bg-violet-500',
    icon: Loader2,
    iconCls: 'text-violet-500 animate-spin',
    glow: 'shadow-violet-500/10',
    progress: 'bg-violet-500',
  },
  default: {
    strip: 'before:bg-border',
    icon: null,
    iconCls: '',
    glow: '',
    progress: 'bg-border',
  },
};

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

  // measure for accurate stacking offsets
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const report = () => onMeasure(toast.id, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [toast.id, onMeasure]);

  // auto-dismiss (loading toasts persist until promise resolves)
  useEffect(() => {
    if (toast.variant === 'loading') return;
    if (expanded) return;
    if (!toast.duration || toast.duration <= 0) return;
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, toast.variant, expanded, dismiss]);

  const style = variantStyles[toast.variant];
  const Icon = style.icon;

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
      <div className="flex items-start gap-3 p-3 pl-4">
        {Icon ? (
          <Icon className={cn('mt-0.5 size-4 shrink-0', style.iconCls)} />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="truncate text-sm font-semibold text-foreground">
            {toast.title}
          </div>
          {toast.description ? (
            <div className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {toast.description}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                dismiss(toast.id);
              }}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {toast.action.label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {/* progress strip */}
      {toast.variant !== 'loading' && toast.duration > 0 && !expanded && index === 0 ? (
        <motion.div
          key={`${toast.id}-progress`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
          className={cn('h-0.5 w-full', style.progress)}
        />
      ) : null}
    </motion.div>
  );
}
