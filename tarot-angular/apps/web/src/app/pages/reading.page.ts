import { Component, inject, OnInit } from "@angular/core";
import { RouteMeta } from "@analogjs/router";
import { TranslatePipe } from "@ngx-translate/core";
import { ReadingBoardComponent } from "../components/reading-board.component";
import { AnalyticsService } from "../services/analytics.service";
import { TarotStateService } from "../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "Reading",
};

@Component({
  standalone: true,
  imports: [ReadingBoardComponent, TranslatePipe],
  template: `
    <section class="grid gap-4">
      <header>
        <p class="zen-eyebrow m-0">{{ 'nav.reading' | translate }}</p>
        <h1 class="m-0 mt-1 font-display text-3xl">Spread table</h1>
      </header>
      <app-reading-board />
    </section>
  `,
})
export default class ReadingPage implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly tarotState = inject(TarotStateService);

  ngOnInit(): void {
    this.analytics.trackPageView("/reading");
    this.analytics.trackReadingFunnel("spread_selected", {
      spread: this.tarotState.spreadId(),
    });
  }
}
