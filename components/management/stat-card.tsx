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

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  gradient: string;
  /** Renders the tile as a button — for grids that double as a filter. */
  onClick?: () => void;
  /** Only meaningful alongside `onClick`: this tile is the active filter. */
  active?: boolean;
  /** Show a placeholder instead of the number while the value is in flight. */
  loading?: boolean;
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
  onClick,
  active,
  loading,
}: StatCardProps) {
  const interactive = !!onClick;

  const body = (
    <>
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
            {loading ? (
              <span className="my-1 block h-6 w-10 animate-pulse rounded bg-muted" />
            ) : (
              <AnimatedNumber value={value} />
            )}
          </p>
        </div>
      </div>
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r",
          gradient,
          active ? "opacity-100" : "opacity-70",
        )}
      />
    </>
  );

  const base =
    "group/stat relative overflow-hidden rounded-xl bg-card p-4 ring-1 transition-shadow duration-200 hover:shadow-md";

  if (!interactive) {
    return <div className={cn(base, "ring-foreground/10")}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        base,
        "w-full cursor-pointer text-left",
        active ? "ring-2 ring-brand/50" : "ring-foreground/10 hover:ring-foreground/20",
      )}
    >
      {body}
    </button>
  );
}
