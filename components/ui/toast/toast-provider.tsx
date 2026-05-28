'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { useToastStore } from './toast-store';
import { ToastItem } from './toast-item';

const VISIBLE = 3;
const GAP = 10;
const STACK_OFFSET = 12;
const SCALE_STEP = 0.05;
const OPACITY_STEP = 0.2;
const DEFAULT_HEIGHT = 72;

export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});

  useEffect(() => setMounted(true), []);

  const onMeasure = useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  // newest first (front of stack)
  const ordered = useMemo(() => [...toasts].reverse(), [toasts]);

  // cleanup heights for dismissed toasts
  useEffect(() => {
    setHeights((prev) => {
      const next: Record<string, number> = {};
      let changed = false;
      for (const t of toasts) {
        if (prev[t.id] !== undefined) next[t.id] = prev[t.id];
        else changed = true;
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });
  }, [toasts]);

  if (!mounted) return null;

  const getHeight = (id: string) => heights[id] ?? DEFAULT_HEIGHT;

  // accumulated Y offset when fully expanded
  const expandedY = (i: number) => {
    let acc = 0;
    for (let j = 0; j < i; j++) acc += getHeight(ordered[j].id) + GAP;
    return acc;
  };

  // container height adapts so hover area covers what's visible
  const containerHeight = expanded
    ? ordered.reduce(
        (sum, t, i) => sum + getHeight(t.id) + (i > 0 ? GAP : 0),
        0,
      )
    : (ordered[0] ? getHeight(ordered[0].id) : DEFAULT_HEIGHT) +
      Math.min(ordered.length - 1, VISIBLE - 1) * STACK_OFFSET;

  return createPortal(
    <div
      data-toast-viewport
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="pointer-events-none fixed bottom-3 right-3 z-[100] w-[calc(100vw-1.5rem)] max-w-[400px] sm:bottom-6 sm:right-6"
      style={{ height: ordered.length === 0 ? 0 : containerHeight }}
    >
      <div className="relative h-full w-full">
        <AnimatePresence initial={false}>
          {ordered.map((toast, i) => {
            const inStack = i < VISIBLE;
            if (!inStack && !expanded) return null;

            const y = expanded ? -expandedY(i) : -i * STACK_OFFSET;
            const scale = expanded ? 1 : Math.max(0.85, 1 - i * SCALE_STEP);
            const opacity = expanded ? 1 : Math.max(0, 1 - i * OPACITY_STEP);
            const zIndex = 1000 - i;

            return (
              <ToastItem
                key={toast.id}
                toast={toast}
                index={i}
                expanded={expanded}
                y={y}
                scale={scale}
                opacity={opacity}
                zIndex={zIndex}
                onMeasure={onMeasure}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}
