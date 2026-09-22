import { Component, inject, OnInit } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { AnalyticsService } from "./services/analytics.service";
import { SeoService } from "./services/seo.service";
import { TarotStateService } from "./services/tarot-state.service";
import { StreakBadgeComponent } from "./components/streak-badge.component";
import { XpBarComponent } from "./components/xp-bar.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    StreakBadgeComponent,
    XpBarComponent,
  ],
  template: `
    <div class="zen-shell">
      <header class="zen-nav">
        <a routerLink="/" class="zen-brand">Tarot</a>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          {{ 'nav.home' | translate }}
        </a>
        <a routerLink="/reading" routerLinkActive="active">
          {{ 'nav.reading' | translate }}
        </a>
        <a routerLink="/history" routerLinkActive="active">
          {{ 'nav.history' | translate }}
        </a>
        <a routerLink="/journal" routerLinkActive="active">
          {{ 'nav.journal' | translate }}
        </a>
        <a routerLink="/arcana" routerLinkActive="active">
          {{ 'nav.arcana' | translate }}
        </a>
        <a routerLink="/learn" routerLinkActive="active">
          {{ 'nav.learn' | translate }}
        </a>
        <a routerLink="/settings" routerLinkActive="active">
          {{ 'nav.settings' | translate }}
        </a>
        <app-streak-badge />
        <app-xp-bar class="hidden sm:block w-28" />
      </header>
      <main class="zen-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);
  private readonly tarotState = inject(TarotStateService);

  ngOnInit(): void {
    this.translate.addLangs(["pt", "en", "es"]);
    this.translate.use(this.tarotState.language());
    this.analytics.init();
    this.seo.init();
    this.tarotState.registerDailyVisit();
  }
}
