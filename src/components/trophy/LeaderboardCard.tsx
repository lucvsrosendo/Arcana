import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/hooks/useStreakCloud";

type LeaderboardCardProps = {
  entries: LeaderboardEntry[];
  title: string;
  emptyLabel: string;
  className?: string;
};

export function LeaderboardCard({
  entries,
  title,
  emptyLabel,
  className,
}: LeaderboardCardProps) {
  return (
    <section className={cn("settings-trophy-block", className)}>
      <header className="settings-trophy-head">
        <h3 className="settings-rail-kicker">{title}</h3>
      </header>
      {entries.length === 0 ? (
        <p className="settings-empty">{emptyLabel}</p>
      ) : (
        <ol className="settings-leaderboard">
          {entries.map((entry) => (
            <li key={entry.userId}>
              <span className="settings-leaderboard-rank">#{entry.rank}</span>
              <Avatar className="leaderboard-avatar h-8 w-8">
                {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt="" /> : null}
                <AvatarFallback>{entry.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="settings-leaderboard-name">{entry.displayName}</span>
              <span className="settings-xp-points">{entry.xpTotal}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
