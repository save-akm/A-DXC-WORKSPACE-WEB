"use client";

import { useEffect, useState } from "react";
import { type LucideIcon } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Counts up to the value once, conveying the metric. Skipped under reduced motion. */
function AnimatedNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    let raf = 0;
    if (reduceMotion) {
      // Snap to the value (in a rAF callback, not synchronously in the effect).
      raf = requestAnimationFrame(() => setDisplayed(value));
      return () => cancelAnimationFrame(raf);
    }
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplayed(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduceMotion]);

  return <>{displayed.toLocaleString()}</>;
}

/**
 * A calm metric tile. Energy comes from one category-colored chip + a thin
 * accent rule, not from 3D tilt / shine sweeps / pulsing dots (decorative
 * motion that the product register bans). The number is the focus; the label
 * is quiet meta above it.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className="group/stat relative overflow-hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm",
            gradient,
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight tracking-tight tabular-nums text-foreground">
            <AnimatedNumber value={value} />
          </p>
        </div>
      </div>
      <span
        aria-hidden
        className={cn("absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r opacity-70", gradient)}
      />
    </div>
  );
}
