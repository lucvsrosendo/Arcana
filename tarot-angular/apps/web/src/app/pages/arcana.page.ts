import { Component, computed, inject, signal } from "@angular/core";
import { RouteMeta } from "@analogjs/router";
import { TranslatePipe } from "@ngx-translate/core";
import Fuse from "fuse.js";
import { majorArcana } from "@tarot/core";
import { TarotStateService } from "../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "Arcana",
};

@Component({
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="grid gap-4">
      <header>
        <p class="zen-eyebrow m-0">{{ 'nav.arcana' | translate }}</p>
        <h1 class="m-0 mt-1 font-display text-3xl">Major Arcana</h1>
      </header>

      <input
        class="zen-input max-w-md"
        [value]="query()"
        (input)="onSearch($event)"
        placeholder="Search cards, keywords, meanings…"
      />

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @for (card of filteredCards(); track card.id) {
          <article class="zen-card p-4">
            <p class="zen-eyebrow m-0">#{{ card.number }}</p>
            <h2 class="mt-1 mb-2 text-lg font-semibold">{{ card.name }}</h2>
            <p class="m-0 text-sm text-tarot-muted">{{ card.description }}</p>
            <p class="mt-3 mb-0 text-xs text-tarot-brand">{{ card.keywords.join(" · ") }}</p>
          </article>
        }
      </div>
    </section>
  `,
})
export default class ArcanaPage {
  private readonly tarotState = inject(TarotStateService);
  readonly query = signal("");

  private readonly fuse = new Fuse(majorArcana, {
    keys: ["name", "description", "keywords", "positiveKeywords", "cautionKeywords"],
    threshold: 0.35,
  });

  readonly filteredCards = computed(() => {
    const q = this.query().trim();
    if (!q) {
      return majorArcana;
    }

    return this.fuse.search(q).map((result) => result.item);
  });

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.query.set(target.value);
  }
}
