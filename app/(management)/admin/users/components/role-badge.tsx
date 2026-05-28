import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  System: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "Super Admin": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  Admin: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  User: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        styles[role] ?? "bg-muted text-muted-foreground",
      )}
    >
      <Shield size={9} />
      {role}
    </span>
  );
}