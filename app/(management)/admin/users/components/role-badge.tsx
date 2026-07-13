import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeRoleName, roleBadgeClass, roleBadgeStyle } from "@/lib/utils/role-color";
import type { UserRole } from "../types";

export function RoleBadge({ role }: { role: UserRole }) {
  const displayName = normalizeRoleName(role.code);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        !role.color && roleBadgeClass(displayName),
      )}
      style={role.color ? roleBadgeStyle(role.color) : undefined}
    >
      <Shield size={9} />
      {displayName}
    </span>
  );
}
