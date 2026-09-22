import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouteMeta } from "@analogjs/router";
import { TranslatePipe } from "@ngx-translate/core";
import { ExportReadingService } from "../services/export-reading.service";
import { TarotStateService } from "../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "History",
};

@Component({
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  template: `
    <section class="grid gap-4">
      <header class="flex items-end justify-between gap-3">
        <div>
          <p class="zen-eyebrow m-0">{{ 'nav.history' | translate }}</p>
          <h1 class="m-0 mt-1 font-display text-3xl">Saved readings</h1>
        </div>
        <span class="text-sm text-tarot-muted">{{ tarotState.history().length }} records</span>
      </header>

      @if (tarotState.history().length === 0) {
        <p class="zen-card p-6 text-tarot-muted m-0">No readings saved yet.</p>
      } @else {
        <div class="grid gap-3">
          @for (record of tarotState.history(); track record.id) {
            <article class="zen-card p-4">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 class="m-0 text-lg font-semibold">{{ record.spreadTitle }}</h2>
                  <p class="m-0 text-sm text-tarot-muted">
                    {{ record.createdAt | date: 'medium' }}
                  </p>
                </div>
                <button class="zen-btn zen-btn-ghost" type="button" (click)="copySummary(record)">
                  Copy
                </button>
              </div>
              @if (record.question) {
                <p class="mt-3 mb-0 text-sm"><strong>Question:</strong> {{ record.question }}</p>
              }
              <ul class="mt-3 mb-0 list-disc pl-5 text-sm text-tarot-muted">
                @for (card of record.cards; track card.cardId) {
                  <li>{{ card.position }} — {{ card.cardName }}</li>
                }
              </ul>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export default class HistoryPage {
  readonly tarotState = inject(TarotStateService);
  private readonly exportReading = inject(ExportReadingService);

  async copySummary(record: Parameters<ExportReadingService["copyReadingSummary"]>[0]) {
    await this.exportReading.copyReadingSummary(record);
  }
}
