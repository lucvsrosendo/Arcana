import { Component, inject, input, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Chat } from "@ai-sdk/angular";
import { DefaultChatTransport, type UIMessage } from "ai";
import { buildTarotChatContext, getSpreadDefinition } from "@tarot/core";
import { TarotStateService } from "../services/tarot-state.service";

const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

@Component({
  selector: "app-tarot-chat",
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="zen-card p-4 flex flex-col gap-3">
      <header class="flex items-center justify-between gap-2">
        <div>
          <p class="zen-eyebrow m-0">Oracle</p>
          <h3 class="m-0 text-base font-semibold">Tarot Chat</h3>
        </div>
        <label class="flex items-center gap-2 text-xs text-tarot-muted">
          <input type="checkbox" [checked]="deepMode()" (change)="toggleDeepMode($event)" />
          Deep mode
        </label>
      </header>

      <div class="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        @for (message of chat.messages; track message.id) {
          <article
            class="rounded-lg px-3 py-2 text-sm"
            [class]="message.role === 'user' ? 'bg-tarot-brand/15 ml-8' : 'bg-tarot-surface-strong/70 mr-8'"
          >
            <p class="m-0 whitespace-pre-wrap">{{ getText(message) }}</p>
          </article>
        }
        @if (chat.status === 'streaming' || chat.status === 'submitted') {
          <p class="text-xs text-tarot-muted m-0">Oracle is typing…</p>
        }
      </div>

      @if (errorMessage()) {
        <p class="text-sm text-tarot-warm m-0">{{ errorMessage() }}</p>
      }

      <form class="flex gap-2" (submit)="send($event)">
        <input
          class="zen-input flex-1"
          [(ngModel)]="draft"
          name="draft"
          placeholder="Ask the oracle about this spread…"
          [disabled]="chat.status === 'streaming' || chat.status === 'submitted'"
        />
        <button class="zen-btn" type="submit" [disabled]="!draft.trim() || chat.status === 'streaming'">
          Send
        </button>
      </form>
    </section>
  `,
})
export class TarotChatComponent {
  private readonly tarotState = inject(TarotStateService);

  readonly focusedSlotId = input<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly deepMode = signal(false);
  draft = "";

  readonly chat = new Chat({
    transport: new DefaultChatTransport({
      api: "/api/v1/chat",
      prepareSendMessagesRequest: ({ messages }) => {
        const context = buildTarotChatContext(
          this.tarotState.language(),
          getSpreadDefinition(this.tarotState.spreadId()),
          this.tarotState.reading(),
          this.tarotState.revealedSlotIds(),
          this.focusedSlotId(),
          this.tarotState.readingQuestion(),
          this.tarotState.learningMode(),
        );

        return {
          body: {
            useAiSdk: true,
            context: { ...context, deepMode: this.deepMode() },
            messages: messages
              .filter((message) => message.role === "user" || message.role === "assistant")
              .slice(-10)
              .map((message) => ({
                role: message.role,
                content: getMessageText(message),
              }))
              .filter((message) => message.content.trim().length > 0),
          },
        };
      },
    }),
    onError: (error) => {
      this.errorMessage.set(error.message || "Chat request failed.");
    },
    onFinish: () => {
      this.errorMessage.set(null);
    },
  });


  getText(message: UIMessage) {
    return getMessageText(message);
  }

  toggleDeepMode(event: Event) {
    const target = event.target as HTMLInputElement;
    this.deepMode.set(target.checked);
  }

  async send(event: Event) {
    event.preventDefault();
    const text = this.draft.trim();
    if (!text) {
      return;
    }

    this.draft = "";
    await this.chat.sendMessage({ text });
  }
}
