import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg bg-gradient-to-br",
              gradient,
            )}
          >
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
            <p className="truncate text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        <div className={cn("h-0.5 w-full bg-gradient-to-r", gradient)} />
      </CardContent>
    </Card>
  );
}
