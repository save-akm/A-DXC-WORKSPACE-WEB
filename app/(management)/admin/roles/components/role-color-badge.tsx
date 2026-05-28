import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  "bg-violet-500":  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-fuchsia-500": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  "bg-sky-500":     "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-amber-500":   "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-emerald-500": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export function RoleColorBadge({
  name,
  color,
  size = "sm",
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        colorMap[color] ?? "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", color)} />
      {name}
    </span>
  );
}
