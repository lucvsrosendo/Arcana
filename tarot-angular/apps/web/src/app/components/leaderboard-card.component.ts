import { Component, inject } from "@angular/core";
import { StreakService } from "../services/streak.service";

@Component({
  selector: "app-leaderboard-card",
  standalone: true,
  template: `
    <section class="zen-card p-4">
      <p class="zen-eyebrow m-0">Community</p>
      <h3 class="mt-1 mb-3 text-lg font-semibold">Top readers this month</h3>
      <ol class="m-0 grid gap-2 p-0 list-none">
        @for (entry of leaderboardQuery.data() ?? []; track entry.userId) {
          <li class="flex items-center justify-between rounded-lg border border-tarot-line/40 px-3 py-2 text-sm">
            <span>
              <span class="text-tarot-brand font-semibold">#{{ entry.rank }}</span>
              {{ entry.displayName }}
            </span>
            <span class="text-tarot-muted">{{ entry.xpTotal }} XP</span>
          </li>
        } @empty {
          <li class="text-sm text-tarot-muted">Leaderboard loads when Supabase is configured.</li>
        }
      </ol>
    </section>
  `,
})
export class LeaderboardCardComponent {
  private readonly streakService = inject(StreakService);
  readonly leaderboardQuery = this.streakService.leaderboardQuery();
}
