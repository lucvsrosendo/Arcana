import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouteMeta } from "@analogjs/router";
import { TranslatePipe } from "@ngx-translate/core";
import { JournalOracleComponent } from "../components/journal-oracle.component";
import { ProfileService } from "../services/profile.service";
import { TarotStateService } from "../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "Journal",
};

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule, TranslatePipe, JournalOracleComponent],
  template: `
    <section class="grid gap-4">
      <header>
        <p class="zen-eyebrow m-0">{{ 'nav.journal' | translate }}</p>
        <h1 class="m-0 mt-1 font-display text-3xl">Reflection journal</h1>
      </header>

      <form class="zen-card p-4 grid gap-3" (submit)="saveEntry($event)">
        <label class="text-sm text-tarot-muted">
          Title
          <input class="zen-input mt-1" [(ngModel)]="title" name="title" required />
        </label>
        <label class="text-sm text-tarot-muted">
          Entry
          <textarea
            class="zen-input mt-1 min-h-28"
            [(ngModel)]="content"
            name="content"
            required
          ></textarea>
        </label>
        <label class="text-sm text-tarot-muted">
          Manifestation
          <input class="zen-input mt-1" [(ngModel)]="manifestation" name="manifestation" />
        </label>
        <button class="zen-btn w-fit" type="submit">Save entry</button>
      </form>

      <app-journal-oracle [draftNote]="content" [manifestation]="manifestation" />

      <div class="grid gap-3">
        @for (entry of tarotState.journal(); track entry.id) {
          <article class="zen-card p-4">
            <h2 class="m-0 text-lg font-semibold">{{ entry.title }}</h2>
            <p class="m-0 text-sm text-tarot-muted">{{ entry.createdAt | date: 'medium' }}</p>
            <p class="mt-3 mb-0 whitespace-pre-wrap">{{ entry.content }}</p>
            @if (entry.manifestation) {
              <p class="mt-2 mb-0 text-sm text-tarot-brand">✦ {{ entry.manifestation }}</p>
            }
          </article>
        }
      </div>
    </section>
  `,
})
export default class JournalPage {
  readonly tarotState = inject(TarotStateService);
  private readonly profile = inject(ProfileService);

  title = "";
  content = "";
  manifestation = "";

  saveEntry(event: Event) {
    event.preventDefault();
    if (!this.title.trim() || !this.content.trim()) {
      return;
    }

    this.tarotState.addJournalEntry({
      title: this.title.trim(),
      content: this.content.trim(),
      manifestation: this.manifestation.trim() || undefined,
    });
    this.profile.awardXp("journalEntry");
    this.title = "";
    this.content = "";
    this.manifestation = "";
  }
}
