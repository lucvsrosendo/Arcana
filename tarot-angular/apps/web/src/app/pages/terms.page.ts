import { Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RouteMeta } from "@analogjs/router";
import { legalContent } from "@tarot/core";
import { SeoService } from "../services/seo.service";
import { TarotStateService } from "../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "Terms",
};

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="grid gap-6 max-w-3xl">
      <a routerLink="/" class="text-sm text-tarot-muted hover:text-tarot-text">← Home</a>
      <header class="zen-card p-6">
        <h1 class="m-0 font-display text-3xl">{{ content.title }}</h1>
        <p class="mt-2 mb-0 text-sm text-tarot-muted">Last updated: {{ content.lastUpdated }}</p>
      </header>
      @for (section of content.sections; track section.title) {
        <section class="zen-card p-6">
          <h2 class="mt-0 text-xl font-semibold">{{ section.title }}</h2>
          @for (paragraph of section.paragraphs; track paragraph) {
            <p class="text-tarot-muted leading-relaxed">{{ paragraph }}</p>
          }
        </section>
      }
    </article>
  `,
})
export default class TermsPage implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly tarotState = inject(TarotStateService);

  readonly content = legalContent[this.tarotState.language()].terms;

  ngOnInit() {
    this.seo.setArticleMeta(this.content.title, this.content.sections[0]?.paragraphs[0] ?? "", "/terms");
  }
}
