import { Component, inject, input, signal } from "@angular/core";
import { Chat } from "@ai-sdk/angular";
import { DefaultChatTransport } from "ai";
import { buildJournalChatContext } from "@tarot/core";
import { TarotStateService } from "../services/tarot-state.service";

@Component({
  selector: "app-journal-oracle",
  standalone: true,
  template: `
    <section class="zen-card p-4 grid gap-3">
      <div>
        <p class="zen-eyebrow m-0">Oracle Vision</p>
        <h3 class="m-0 text-base font-semibold">One-shot reflection</h3>
      </div>

      @if (oracleText()) {
        <p class="m-0 text-sm whitespace-pre-wrap text-tarot-muted">{{ oracleText() }}</p>
      }

      @if (errorMessage()) {
        <p class="m-0 text-sm text-tarot-warm">{{ errorMessage() }}</p>
      }

      <button
        class="zen-btn w-fit"
        type="button"
        [disabled]="chat.status === 'streaming' || chat.status === 'submitted'"
        (click)="runOracle()"
      >
        {{
          chat.status === "streaming" || chat.status === "submitted"
            ? "Consulting…"
            : "Ask the oracle"
        }}
      </button>
    </section>
  `,
})
export class JournalOracleComponent {
  private readonly tarotState = inject(TarotStateService);

  readonly draftNote = input("");
  readonly manifestation = input("");
  readonly linkedCards = input<Array<{ position: string; cardName: string; number: number }>>([]);

  readonly errorMessage = signal<string | null>(null);
  readonly oracleText = signal("");

  readonly chat = new Chat({
    transport: new DefaultChatTransport({
      api: "/api/v1/chat",
      prepareSendMessagesRequest: ({ messages }) => {
        const context = buildJournalChatContext(
          this.tarotState.language(),
          { id: "journal", title: "Journal reflection" },
          this.linkedCards(),
          this.draftNote(),
          this.manifestation(),
        );

        return {
          body: {
            useAiSdk: true,
            context,
            messages: messages
              .filter((message) => message.role === "user" || message.role === "assistant")
              .map((message) => ({
                role: message.role,
                content: message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join(""),
              })),
          },
        };
      },
    }),
    onError: (error) => {
      this.errorMessage.set(error.message || "Oracle request failed.");
    },
    onFinish: () => {
      const last = [...this.chat.messages].reverse().find((message) => message.role === "assistant");
      if (last) {
        this.oracleText.set(
          last.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join(""),
        );
      }
      this.errorMessage.set(null);
    },
  });

  async runOracle() {
    this.oracleText.set("");
    await this.chat.sendMessage({
      text: "Give a short oracle vision for this journal entry in symbolic tarot language.",
    });
  }
}
