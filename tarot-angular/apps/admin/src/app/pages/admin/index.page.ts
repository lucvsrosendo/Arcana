import { Component, computed, inject } from "@angular/core";
import { RouteMeta } from "@analogjs/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import { newsAuthGuard } from "../../guards/news-auth.guard";
import { CommentsAdminService } from "../../services/comments-admin.service";
import { NewsAdminService } from "../../services/news-admin.service";

export const routeMeta: RouteMeta = {
  title: "Dashboard",
  canActivate: [newsAuthGuard],
};

@Component({
  standalone: true,
  imports: [CardModule, SkeletonModule],
  template: `
    <header class="page-header">
      <h1>Dashboard</h1>
      <p>Overview of news moderation activity.</p>
    </header>

    @if (statsQuery.isPending()) {
      <div class="kpi-grid">
        @for (item of [1, 2, 3, 4]; track item) {
          <p-skeleton height="6rem" borderRadius="0.75rem" />
        }
      </div>
    } @else if (statsQuery.isError()) {
      <p-card>
        <p class="m-0">Failed to load dashboard metrics.</p>
      </p-card>
    } @else {
      <div class="kpi-grid">
        @for (card of kpiCards(); track card.label) {
          <p-card>
            <div class="text-sm text-muted-color">{{ card.label }}</div>
            <div class="text-3xl font-semibold mt-2">{{ card.value }}</div>
          </p-card>
        }
      </div>
    }
  `,
})
export default class AdminDashboardPage {
  private readonly newsService = inject(NewsAdminService);
  private readonly commentsService = inject(CommentsAdminService);

  readonly statsQuery = injectQuery(() => ({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [newsCount, commentCount, reportCount, commentsToday] =
        await Promise.all([
          this.newsService.countAll(),
          this.commentsService.countAllComments(),
          this.commentsService.countReports(),
          this.commentsService.countCommentsToday(),
        ]);

      return { newsCount, commentCount, reportCount, commentsToday };
    },
  }));

  readonly kpiCards = computed(() => {
    const stats = this.statsQuery.data();
    if (!stats) {
      return [];
    }

    return [
      { label: "Published articles", value: stats.newsCount },
      { label: "Total comments", value: stats.commentCount },
      { label: "Open reports", value: stats.reportCount },
      { label: "Comments today", value: stats.commentsToday },
    ];
  });
}
