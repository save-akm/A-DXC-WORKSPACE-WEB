import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleBadgeClass } from "@/lib/utils/role-color";

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        roleBadgeClass(role),
      )}
    >
      <Shield size={9} />
      {role}
    </span>
  );
}