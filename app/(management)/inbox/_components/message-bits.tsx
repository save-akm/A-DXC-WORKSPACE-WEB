'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  const reduce = useReducedMotion();
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} กำลังพิมพ์`
      : names.length === 2
        ? `${names[0]} และ ${names[1]} กำลังพิมพ์`
        : `${names[0]} และอีก ${names.length - 1} คนกำลังพิมพ์`;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground"
      aria-live="polite"
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1 rounded-full bg-brand/70"
            animate={reduce ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          />
        ))}
      </span>
      <span>{label}</span>
    </motion.div>
  );
}

interface DateDividerProps {
  label: string;
}

export function DateDivider({ label }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-muted/80 px-3 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border/50">
        {label}
      </span>
    </div>
  );
}

interface SystemMessageProps {
  content: string;
}

export function SystemMessage({ content }: SystemMessageProps) {
  return (
    <div className="flex justify-center px-4 py-1">
      <p className="max-w-md text-center text-[11px] text-muted-foreground">{content}</p>
    </div>
  );
}
