import { Component, inject } from "@angular/core";
import { getXpBarProgress, getXpLevel } from "@tarot/core";
import { ProfileService } from "../services/profile.service";

@Component({
  selector: "app-xp-bar",
  standalone: true,
  template: `
    <div class="flex flex-col gap-1" title="XP progress">
      <div class="h-1.5 rounded-full bg-tarot-line/40 overflow-hidden">
        <div
          class="h-full rounded-full bg-tarot-brand transition-all duration-500"
          [style.width.%]="progress()"
        ></div>
      </div>
      <span class="text-[0.65rem] text-tarot-muted text-right">
        {{ level().label }} · {{ xpTotal() }} XP
      </span>
    </div>
  `,
})
export class XpBarComponent {
  private readonly profile = inject(ProfileService);

  readonly xpTotal = this.profile.xpTotal;
  readonly progress = () => getXpBarProgress(this.xpTotal());
  readonly level = () => getXpLevel(this.xpTotal());
}
