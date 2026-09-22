import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

type StreakBadgeProps = {
  streak: number;
  label: string;
  className?: string;
};

export function StreakBadge({ streak, label, className }: StreakBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-muted/25 px-3 py-1.5 text-sm",
        className,
      )}
      aria-label={`${label}: ${streak}`}
    >
      <Flame className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-minimal text-muted-foreground">{label}</span>
      <strong className="font-medium tabular-nums">{streak}</strong>
    </div>
  );
}
