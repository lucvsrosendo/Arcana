import { Component, input, output } from "@angular/core";
import type { XpLevel } from "@tarot/core";

@Component({
  selector: "app-achievement-modal",
  standalone: true,
  template: `
    @if (level()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
      >
        <article class="zen-card max-w-sm p-6 text-center">
          <p class="zen-eyebrow m-0">Achievement unlocked</p>
          <h3 class="mt-2 mb-2 text-2xl font-display text-tarot-brand">{{ level()!.label }}</h3>
          <p class="m-0 text-sm text-tarot-muted">
            You reached {{ level()!.minXp }} XP on your tarot journey.
          </p>
          <button class="zen-btn mt-4" type="button" (click)="dismiss.emit()">Continue</button>
        </article>
      </div>
    }
  `,
})
export class AchievementModalComponent {
  readonly level = input<XpLevel | null>(null);
  readonly dismiss = output<void>();
}
