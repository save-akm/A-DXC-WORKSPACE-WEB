"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
  layoutId,
  itemLabel = "items",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
  /** Must be unique per page to prevent Framer Motion animation conflicts */
  layoutId: string;
  itemLabel?: string;
}) {
  if (totalPages <= 1 && total === 0) return null;
  const range = paginationRange(page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 sm:px-5">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">{from}–{to}</span>{" "}
        of <span className="font-medium text-foreground">{total}</span> {itemLabel}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
          >
            <ChevronLeft size={14} />
          </Button>

          {range.map((p, i) =>
            p === "…" ? (
              <span
                key={`e${i}`}
                className="flex size-7 items-center justify-center text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={cn(
                  "relative flex size-7 cursor-pointer items-center justify-center rounded-md text-xs font-medium transition-colors",
                  page === p
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <AnimatePresence>
                  {page === p && (
                    <motion.span
                      layoutId={layoutId}
                      className="absolute inset-0 rounded-md bg-primary"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
                <span className="relative z-10">{p}</span>
              </button>
            ),
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page === totalPages}
            onClick={() => onChange(page + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
