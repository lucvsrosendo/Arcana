import { cn } from "@/lib/utils";

type AchievementUnlockedProps = {
  title: string;
  description: string;
  points?: number;
  className?: string;
  /** i18n label for "Achievement unlocked" — defaults to English fallback */
  labelText?: string;
};

export function AchievementUnlocked({
  title,
  description,
  points,
  className,
  labelText = "Achievement unlocked",
}: AchievementUnlockedProps) {
  return (
    <div
      className={cn("settings-achievement-status", className)}
      role="status"
      aria-live="polite"
    >
      <span className="settings-achievement-mark" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="settings-rail-kicker">{labelText}</p>
        <p className="settings-achievement-title">{title}</p>
        <p className="settings-action-desc">{description}</p>
        {points !== undefined ? (
          <p className="settings-xp-points mt-1">+{points}</p>
        ) : null}
      </div>
    </div>
  );
}
