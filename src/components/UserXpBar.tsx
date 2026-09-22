import CountUp from "react-countup";
import { getXpBarProgress } from "../data/xpRules";

type UserXpBarProps = {
  xpTotal: number;
  label: string;
  ariaLabel: string;
};

export function UserXpBar({ xpTotal, label, ariaLabel }: UserXpBarProps) {
  const progress = getXpBarProgress(xpTotal);

  return (
    <div
      className="hidden items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-card px-2 py-1 lg:flex"
      aria-label={ariaLabel}
    >
      <span className="zen-xp-mark" aria-hidden="true" />
      <span className="text-minimal text-muted-foreground">
        {label}{" "}
        <CountUp end={xpTotal} duration={0.6} preserveValue />
      </span>
      <div className="zen-xp-bar w-16" aria-hidden="true">
        <span className="zen-xp-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
