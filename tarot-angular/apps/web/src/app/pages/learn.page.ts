import { Component } from "@angular/core";
import { RouteMeta } from "@analogjs/router";
import { TranslatePipe } from "@ngx-translate/core";
import { arcanaDetails, getSpreadDefinition, majorArcana } from "@tarot/core";

export const routeMeta: RouteMeta = {
  title: "Learn",
};

@Component({
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="grid gap-4 max-w-3xl">
      <header>
        <p class="zen-eyebrow m-0">{{ 'nav.learn' | translate }}</p>
        <h1 class="m-0 mt-1 font-display text-3xl">Learning paths</h1>
        <p class="mt-2 mb-0 text-tarot-muted">
          Study spreads, position prompts, and symbolic correspondences.
        </p>
      </header>

      <article class="zen-card p-5">
        <h2 class="mt-0 text-xl font-semibold">Three-card spread</h2>
        <p class="text-sm text-tarot-muted">{{ threeCard.description }}</p>
        <ul class="mt-4 space-y-2 text-sm">
          @for (position of threeCard.positions; track position.id) {
            <li class="rounded-lg border border-tarot-line/40 px-3 py-2">
              <strong>{{ position.title }}</strong> — {{ position.prompt }}
              <p class="m-0 mt-1 text-tarot-muted">{{ position.learningNote }}</p>
            </li>
          }
        </ul>
      </article>

      <article class="zen-card p-5">
        <h2 class="mt-0 text-xl font-semibold">Symbols spotlight</h2>
        <div class="grid gap-3">
          @for (detail of sampleDetails; track detail.cardId) {
            <div class="rounded-lg border border-tarot-line/40 px-3 py-2 text-sm">
              <p class="m-0 font-semibold">{{ detail.title }}</p>
              <p class="m-0 mt-1 text-tarot-muted">{{ detail.symbols.join(" · ") }}</p>
            </div>
          }
        </div>
      </article>
    </section>
  `,
})
export default class LearnPage {
  readonly threeCard = getSpreadDefinition("three-card");

  readonly sampleDetails = majorArcana.slice(0, 6).map((card) => ({
    cardId: card.id,
    title: card.name,
    symbols: arcanaDetails[card.id]?.symbols.pt.slice(0, 4) ?? card.keywords.slice(0, 4),
  }));
}
