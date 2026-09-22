import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RouteMeta } from "@analogjs/router";
import { TranslatePipe } from "@ngx-translate/core";
import { format } from "date-fns";
import { Moon } from "lunarphase-js";
import { majorArcana } from "@tarot/core";
import { LeaderboardCardComponent } from "../components/leaderboard-card.component";
import { NewsService } from "../services/news.service";
import { TarotStateService } from "../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "Tarot — Home",
};

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, LeaderboardCardComponent],
  template: `
    <section class="grid gap-6">
      <div class="zen-card p-6 md:p-8">
        <p class="zen-eyebrow m-0">{{ 'nav.home' | translate }}</p>
        <h1 class="mt-2 mb-3 font-display text-3xl md:text-4xl">Major Arcana readings</h1>
        <p class="m-0 max-w-2xl text-tarot-muted">
          Zen dark table for symbolic reflection with the 22 Major Arcana — spreads, journal, and
          learning paths.
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <a routerLink="/reading" class="zen-btn">{{ 'nav.reading' | translate }}</a>
          <a routerLink="/learn" class="zen-btn zen-btn-ghost">{{ 'nav.learn' | translate }}</a>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="zen-card p-4">
          <p class="zen-eyebrow m-0">Daily card</p>
          <h2 class="mt-2 text-xl font-semibold">{{ tarotState.dailyCard().name }}</h2>
          <p class="text-sm text-tarot-muted m-0">{{ tarotState.dailyCard().description }}</p>
        </article>
        <article class="zen-card p-4">
          <p class="zen-eyebrow m-0">Moon</p>
          <h2 class="mt-2 text-xl font-semibold">{{ moonPhase() }}</h2>
          <p class="text-sm text-tarot-muted m-0">{{ todayLabel() }}</p>
        </article>
        <article class="zen-card p-4">
          <p class="zen-eyebrow m-0">Streak</p>
          <h2 class="mt-2 text-xl font-semibold">{{ tarotState.dailyStreak() }} days</h2>
          <p class="text-sm text-tarot-muted m-0">{{ majorArcana.length }} arcana in deck</p>
        </article>
      </div>

      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="m-0 text-lg font-semibold">News</h2>
          <span class="text-sm text-tarot-muted">{{ newsQuery.data()?.length ?? 0 }} articles</span>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          @for (item of newsQuery.data() ?? []; track item.id) {
            <a
              [routerLink]="['/news', item.id]"
              class="zen-card block p-4 transition hover:border-tarot-brand/40"
            >
              <p class="zen-eyebrow m-0">{{ item.publishedAt | date: 'mediumDate' }}</p>
              <h3 class="mt-1 mb-2 text-lg font-semibold">{{ item.title }}</h3>
              <p class="m-0 text-sm text-tarot-muted">{{ item.summary }}</p>
            </a>
          }
        </div>
      </section>

      <app-leaderboard-card />
    </section>
  `,
})
export default class IndexPage {
  readonly tarotState = inject(TarotStateService);
  private readonly newsService = inject(NewsService);

  readonly newsQuery = this.newsService.newsQuery(this.tarotState.language());
  readonly majorArcana = majorArcana;

  moonPhase() {
    return Moon.lunarPhase();
  }

  todayLabel() {
    return format(new Date(), "EEEE, d MMMM");
  }
}
