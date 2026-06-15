import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeRoleName, roleBadgeClass } from "@/lib/utils/role-color";

export function RoleBadge({ role }: { role: string }) {
  const displayName = normalizeRoleName(role);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        roleBadgeClass(displayName),
      )}
    >
      <Shield size={9} />
      {displayName}
    </span>
  );
}