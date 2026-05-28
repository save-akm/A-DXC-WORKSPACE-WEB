import { cn } from "@/lib/utils";

export function StatusDot({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "active"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "active" ? "bg-emerald-500" : "bg-rose-500",
        )}
      />
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}