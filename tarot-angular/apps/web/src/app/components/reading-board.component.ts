import { Component, computed, inject, signal } from "@angular/core";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { FormsModule } from "@angular/forms";
import { getSpreadDefinition } from "@tarot/core";
import { AnalyticsService } from "../services/analytics.service";
import { ExportReadingService } from "../services/export-reading.service";
import { ProfileService } from "../services/profile.service";
import { TarotStateService } from "../services/tarot-state.service";
import { TarotChatComponent } from "./tarot-chat.component";

@Component({
  selector: "app-reading-board",
  standalone: true,
  imports: [ScrollingModule, FormsModule, TarotChatComponent],
  template: `
    <section class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div class="zen-card p-4 md:p-5">
        <header class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="zen-eyebrow m-0">Spread</p>
            <h2 class="m-0 font-display text-2xl">{{ spreadTitle() }}</h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="zen-btn zen-btn-ghost" type="button" (click)="shuffle()">Shuffle</button>
            <button class="zen-btn" type="button" (click)="revealAll()" [disabled]="isComplete()">
              Reveal all
            </button>
          </div>
        </header>

        <label class="block mb-4 text-sm text-tarot-muted">
          Question (optional)
          <input
            class="zen-input mt-1"
            [ngModel]="tarotState.readingQuestion()"
            (ngModelChange)="tarotState.readingQuestion.set($event)"
            name="question"
            placeholder="What wants to be seen today?"
          />
        </label>

        <cdk-virtual-scroll-viewport
          itemSize="112"
          class="h-[26rem] rounded-xl border border-tarot-line/50 bg-tarot-bg/30"
          (touchstart)="onTouchStart($event)"
          (touchend)="onTouchEnd($event)"
        >
          <article
            *cdkVirtualFor="let slot of tarotState.reading(); trackBy: trackSlot"
            class="flex items-center gap-3 border-b border-tarot-line/30 px-3 py-3"
            [class.opacity-45]="!isRevealed(slot.id)"
          >
            <button
              type="button"
              class="min-w-0 flex-1 text-left"
              (click)="reveal(slot.id)"
              [disabled]="isRevealed(slot.id)"
            >
              <p class="m-0 text-xs uppercase tracking-wide text-tarot-muted">
                {{ slot.position.title }}
              </p>
              <p class="m-0 font-semibold">
                @if (isRevealed(slot.id)) {
                  {{ slot.card.name }}
                  @if (slot.reversed) {
                    <span class="text-tarot-warm text-sm"> (reversed)</span>
                  }
                } @else {
                  Hidden card
                }
              </p>
              <p class="m-0 text-sm text-tarot-muted">{{ slot.position.prompt }}</p>
            </button>
            <button
              type="button"
              class="zen-btn zen-btn-ghost shrink-0"
              (click)="focusSlot(slot.id)"
            >
              Focus
            </button>
          </article>
        </cdk-virtual-scroll-viewport>

        <div class="mt-4 flex flex-wrap gap-2">
          <button class="zen-btn" type="button" (click)="saveReading()" [disabled]="!canSave()">
            Save reading
          </button>
          <button
            class="zen-btn zen-btn-ghost"
            type="button"
            (click)="exportSummary()"
            [disabled]="!canSave()"
          >
            Copy summary
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div #readingExport class="zen-card p-4">
          <p class="zen-eyebrow m-0">Snapshot</p>
          <h3 class="mt-1 mb-3 text-lg font-semibold">{{ spreadTitle() }}</h3>
          <ul class="m-0 list-none space-y-2 p-0 text-sm">
            @for (slot of revealedSlots(); track slot.id) {
              <li class="rounded-lg border border-tarot-line/40 px-3 py-2">
                <span class="text-tarot-muted">{{ slot.position.title }}:</span>
                {{ slot.card.name }}
              </li>
            }
          </ul>
        </div>
        <app-tarot-chat [focusedSlotId]="focusedSlotId()" />
      </div>
    </section>
  `,
})
export class ReadingBoardComponent {
  readonly tarotState = inject(TarotStateService);
  private readonly analytics = inject(AnalyticsService);
  private readonly profile = inject(ProfileService);
  private readonly exportReading = inject(ExportReadingService);

  readonly focusedSlotId = signal<string | null>(null);
  readonly isComplete = this.tarotState.isComplete;

  private touchStartX = 0;

  readonly spreadTitle = computed(
    () => getSpreadDefinition(this.tarotState.spreadId()).title,
  );

  readonly revealedSlots = computed(() =>
    this.tarotState
      .reading()
      .filter((slot) => this.tarotState.revealedSlotIds().includes(slot.id)),
  );

  trackSlot(_index: number, slot: { id: string }) {
    return slot.id;
  }

  isRevealed(slotId: string) {
    return this.tarotState.revealedSlotIds().includes(slotId);
  }

  reveal(slotId: string) {
    this.tarotState.revealCard(slotId);
    if (this.tarotState.isComplete()) {
      this.analytics.trackReadingFunnel("all_revealed", {
        spread: this.tarotState.spreadId(),
      });
    }
  }

  revealAll() {
    this.tarotState.revealAll();
    this.analytics.trackReadingFunnel("all_revealed", {
      spread: this.tarotState.spreadId(),
    });
  }

  shuffle() {
    this.tarotState.drawReading(this.tarotState.spreadId());
    this.focusedSlotId.set(null);
    this.analytics.trackReadingFunnel("shuffle_complete", {
      spread: this.tarotState.spreadId(),
    });
  }

  focusSlot(slotId: string) {
    this.focusedSlotId.set(slotId);
    if (!this.isRevealed(slotId)) {
      this.reveal(slotId);
    }
  }

  canSave() {
    return this.tarotState.revealedSlotIds().length > 0 && !this.tarotState.currentReadingSaved();
  }

  saveReading() {
    const record = this.tarotState.saveCurrentReading();
    if (record) {
      this.profile.awardXp("readingSaved");
      this.analytics.trackReadingFunnel("reading_saved", { spread: record.spreadId });
    }
  }

  async exportSummary() {
    const record = this.tarotState.saveCurrentReading();
    if (record) {
      await this.exportReading.copyReadingSummary(record);
    }
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  onTouchEnd(event: TouchEvent) {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const delta = endX - this.touchStartX;

    if (Math.abs(delta) < 48) {
      return;
    }

    const nextHidden = this.tarotState
      .reading()
      .find((slot) => !this.isRevealed(slot.id));

    if (nextHidden) {
      this.reveal(nextHidden.id);
    }
  }
}
