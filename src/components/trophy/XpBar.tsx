import { Progress } from "@/components/ui/progress";
import {
  getNextXpLevel,
  getXpBarProgress,
  getXpLevel,
  XP_BAR_SCALE,
} from "@/data/xpRules";

type XpBarProps = {
  xpTotal: number;
  levelLabel?: string;
  nextLevelLabel?: string;
};

export function XpBar({ xpTotal, levelLabel, nextLevelLabel }: XpBarProps) {
  const level = getXpLevel(xpTotal);
  const next = getNextXpLevel(xpTotal);
  const progress = getXpBarProgress(xpTotal);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{levelLabel ?? level.label}</span>
        <span className="text-muted-foreground">
          {xpTotal} XP
          {next ? ` (${next.minXp - xpTotal} to ${nextLevelLabel ?? next.label})` : ""}
        </span>
      </div>
      <Progress value={progress} className="h-2" aria-label={`${progress}% of ${XP_BAR_SCALE} XP`} />
    </div>
  );
}
