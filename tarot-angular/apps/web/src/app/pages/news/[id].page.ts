import { DatePipe } from "@angular/common";
import { Component, computed, inject, input, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouteMeta } from "@analogjs/router";
import { MarkdownModule } from "ngx-markdown";
import { AuthService } from "../../services/auth.service";
import { CommentsService, type NewsComment } from "../../services/comments.service";
import { NewsService, type SiteNewsItem } from "../../services/news.service";
import { ProfileService } from "../../services/profile.service";
import { SeoService } from "../../services/seo.service";
import { TarotStateService } from "../../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "News",
};

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule, MarkdownModule],
  template: `
    @if (article()) {
      <article class="grid gap-6 max-w-3xl">
        <header class="zen-card p-6">
          <p class="zen-eyebrow m-0">News</p>
          <h1 class="mt-2 mb-2 font-display text-3xl">{{ article()!.title }}</h1>
          <p class="m-0 text-sm text-tarot-muted">
            {{ article()!.publishedAt | date: 'medium' }}
          </p>
          <p class="mt-4 mb-0 text-tarot-muted">{{ article()!.summary }}</p>
        </header>

        <div class="zen-card p-6 prose prose-invert max-w-none">
          <markdown [data]="article()!.body"></markdown>
        </div>

        <section class="zen-card p-4 grid gap-3">
          <h2 class="m-0 text-lg font-semibold">Comments</h2>

          @for (comment of rootComments(); track comment.id) {
            <article class="rounded-lg border border-tarot-line/40 px-3 py-2 text-sm">
              <p class="m-0 font-semibold">{{ comment.displayName }}</p>
              <p class="m-0 text-tarot-muted">{{ comment.createdAt | date: 'short' }}</p>
              <p class="mt-2 mb-2 whitespace-pre-wrap">{{ comment.body }}</p>
              <button
                class="zen-btn zen-btn-ghost text-xs py-1 px-2"
                type="button"
                (click)="setReplyTarget(comment.id)"
              >
                Reply
              </button>

              @for (reply of repliesFor(comment.id); track reply.id) {
                <article class="mt-3 ml-4 rounded-lg border border-tarot-line/25 px-3 py-2">
                  <p class="m-0 font-semibold">{{ reply.displayName }}</p>
                  <p class="m-0 text-tarot-muted">{{ reply.createdAt | date: 'short' }}</p>
                  <p class="mt-2 mb-0 whitespace-pre-wrap">{{ reply.body }}</p>
                </article>
              }
            </article>
          }

          <form class="grid gap-2" (submit)="postComment($event)">
            @if (replyTargetId()) {
              <p class="m-0 text-xs text-tarot-muted">Replying to a comment.</p>
            }
            <textarea
              class="zen-input min-h-20"
              [(ngModel)]="commentDraft"
              name="comment"
              placeholder="Share a reflection… Use @name to mention someone."
            ></textarea>
            <div class="flex gap-2">
              <button class="zen-btn w-fit" type="submit" [disabled]="createMutation.isPending()">
                Post comment
              </button>
              @if (replyTargetId()) {
                <button class="zen-btn zen-btn-ghost w-fit" type="button" (click)="clearReplyTarget()">
                  Cancel reply
                </button>
              }
            </div>
            @if (commentError()) {
              <p class="text-sm text-tarot-warm m-0">{{ commentError() }}</p>
            }
          </form>
        </section>
      </article>
    } @else {
      <p class="zen-card p-6 text-tarot-muted m-0">Article not found.</p>
    }
  `,
})
export default class NewsDetailPage implements OnInit {
  readonly id = input.required<string>();

  private readonly newsService = inject(NewsService);
  private readonly tarotState = inject(TarotStateService);
  private readonly commentsService = inject(CommentsService);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  private readonly seo = inject(SeoService);

  readonly article = signal<SiteNewsItem | null>(null);
  readonly commentError = signal<string | null>(null);
  readonly replyTargetId = signal<string | null>(null);
  commentDraft = "";

  readonly commentsQuery = this.commentsService.commentsQuery(this.id(), "newest");
  readonly createMutation = this.commentsService.createCommentMutation(this.id(), "newest");

  readonly rootComments = computed(() =>
    (this.commentsQuery.data() ?? []).filter((comment) => !comment.parentId),
  );

  repliesFor(parentId: string) {
    return (this.commentsQuery.data() ?? []).filter((comment) => comment.parentId === parentId);
  }

  async ngOnInit() {
    const item = await this.newsService.fetchById(this.id(), this.tarotState.language());
    this.article.set(item);

    if (item) {
      this.seo.setArticleMeta(item.title, item.summary, `/news/${item.id}`);
    }
  }

  setReplyTarget(commentId: string) {
    this.replyTargetId.set(commentId);
  }

  clearReplyTarget() {
    this.replyTargetId.set(null);
  }

  async postComment(event: Event) {
    event.preventDefault();
    this.commentError.set(null);

    const body = this.formatMentions(this.commentDraft);

    try {
      await this.createMutation.mutateAsync({
        body,
        displayName: this.auth.getDisplayName(),
        userId: this.auth.user()?.id,
        parentId: this.replyTargetId() ?? undefined,
      });
      this.commentDraft = "";
      this.replyTargetId.set(null);
      this.profile.awardXp("commentCreated");
    } catch (error) {
      this.commentError.set(error instanceof Error ? error.message : "Failed to post comment.");
    }
  }

  private formatMentions(text: string) {
    return text.replace(/@([a-zA-Z0-9_\-]+)/g, "**@$1**");
  }
}
