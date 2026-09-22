import { Component, computed, inject } from "@angular/core";
import { RouteMeta } from "@analogjs/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { ChartModule } from "primeng/chart";
import { CardModule } from "primeng/card";
import { newsAuthGuard } from "../../guards/news-auth.guard";
import { CommentsAdminService } from "../../services/comments-admin.service";

export const routeMeta: RouteMeta = {
  title: "Engagement",
  canActivate: [newsAuthGuard],
};

@Component({
  standalone: true,
  imports: [ChartModule, CardModule],
  template: `
    <header class="page-header">
      <h1>Engagement</h1>
      <p>Daily comment volume over the last 14 days.</p>
    </header>

    <div class="chart-wrap">
      <p-card>
        @if (engagementQuery.isPending()) {
          <p>Loading chart…</p>
        } @else if (engagementQuery.isError()) {
          <p>Failed to load engagement data.</p>
        } @else {
          <p-chart type="line" [data]="chartData()" [options]="chartOptions" />
        }
      </p-card>
    </div>
  `,
})
export default class AdminEngagementPage {
  private readonly commentsService = inject(CommentsAdminService);

  readonly engagementQuery = injectQuery(() => ({
    queryKey: ["admin-engagement"],
    queryFn: () => this.commentsService.commentsPerDay(14),
  }));

  readonly chartData = computed(() => {
    const points = this.engagementQuery.data() ?? [];

    return {
      labels: points.map((point) => point.day),
      datasets: [
        {
          label: "Comments per day",
          data: points.map((point) => point.count),
          fill: true,
          tension: 0.3,
          borderColor: "#818cf8",
          backgroundColor: "rgba(129, 140, 248, 0.18)",
        },
      ],
    };
  });

  readonly chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#cbd5e1",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.15)" },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#94a3b8",
          precision: 0,
        },
        grid: { color: "rgba(148, 163, 184, 0.15)" },
      },
    },
  };
}
