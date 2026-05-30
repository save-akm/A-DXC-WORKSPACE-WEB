import { cn } from "@/lib/utils";
import { ROLE_COLOR_BADGE_CLASSES } from "@/lib/utils/role-color";

const colorMap = ROLE_COLOR_BADGE_CLASSES;

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
