import { Component, inject } from "@angular/core";
import { TarotStateService } from "../services/tarot-state.service";

@Component({
  selector: "app-streak-badge",
  standalone: true,
  template: `
    @if (streak() > 0) {
      <span
        class="inline-flex items-center gap-1 rounded-full border border-tarot-brand/35 bg-tarot-brand/10 px-2 py-0.5 text-xs text-tarot-brand"
        title="Daily streak"
      >
        <span aria-hidden="true">✦</span>
        {{ streak() }}
      </span>
    }
  `,
})
export class StreakBadgeComponent {
  private readonly tarotState = inject(TarotStateService);
  readonly streak = this.tarotState.dailyStreak;
}
