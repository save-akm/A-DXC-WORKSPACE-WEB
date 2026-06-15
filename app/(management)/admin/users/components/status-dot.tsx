import { cn } from "@/lib/utils";
import type { UserStatus } from "../types";

const STATUS_CONFIG: Record<UserStatus, { label: string; dot: string; badge: string }> = {
  ACTIVE:     { label: "Active",     dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  PENDING:    { label: "Pending",    dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  SUSPENDED:  { label: "Suspended",  dot: "bg-orange-500",  badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" },
  TERMINATED: { label: "Terminated", dot: "bg-rose-500",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
};

export function StatusDot({ status }: { status: UserStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", cfg.badge)}>
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}