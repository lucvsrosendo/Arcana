import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouteMeta } from "@analogjs/router";
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { newsAuthGuard } from "../../guards/news-auth.guard";
import {
  CommentReportRecord,
  CommentsAdminService,
} from "../../services/comments-admin.service";

export const routeMeta: RouteMeta = {
  title: "Reports",
  canActivate: [newsAuthGuard],
};

@Component({
  standalone: true,
  providers: [ConfirmationService, MessageService],
  imports: [
    DatePipe,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
  ],
  template: `
    <p-toast />
    <p-confirmDialog />

    <header class="page-header">
      <h1>Reports</h1>
      <p>Moderate user-submitted comment reports.</p>
    </header>

    <p-toolbar class="mb-4">
      <ng-template pTemplate="end">
        <p-button
          label="Refresh"
          icon="pi pi-refresh"
          [text]="true"
          (onClick)="reportsQuery.refetch()"
        />
      </ng-template>
    </p-toolbar>

    <p-table
      [value]="reportsQuery.data() ?? []"
      [loading]="reportsQuery.isPending()"
      [paginator]="true"
      [rows]="12"
      dataKey="id"
      responsiveLayout="scroll"
    >
      <ng-template pTemplate="header">
        <tr>
          <th>Article</th>
          <th>Comment</th>
          <th>Reason</th>
          <th>Reported</th>
          <th style="width: 8rem">Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-row>
        <tr>
          <td>{{ row.newsTitle }}</td>
          <td>
            <div class="font-medium">{{ row.commentAuthor }}</div>
            <div class="text-sm text-muted-color">{{ row.commentBody }}</div>
          </td>
          <td>
            @if (row.reason) {
              {{ row.reason }}
            } @else {
              <p-tag severity="secondary" value="No reason" />
            }
          </td>
          <td>{{ row.createdAt | date: "medium" }}</td>
          <td>
            <p-button
              label="Delete comment"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              (onClick)="confirmDeleteComment(row)"
            />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="5">No open reports.</td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export default class AdminReportsPage {
  private readonly commentsService = inject(CommentsAdminService);
  private readonly queryClient = injectQueryClient();
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly reportsQuery = injectQuery(() => ({
    queryKey: ["admin-reports"],
    queryFn: () => this.commentsService.fetchReports(),
  }));

  readonly deleteMutation = injectMutation(() => ({
    mutationFn: (commentId: string) => this.commentsService.deleteComment(commentId),
    onSuccess: () => {
      this.messages.add({
        severity: "success",
        summary: "Reported comment removed",
      });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-engagement"] });
    },
    onError: () => {
      this.messages.add({
        severity: "error",
        summary: "Could not delete reported comment",
      });
    },
  }));

  confirmDeleteComment(report: CommentReportRecord) {
    this.confirmation.confirm({
      header: "Remove reported comment",
      message: `Delete the reported comment on "${report.newsTitle}"?`,
      icon: "pi pi-exclamation-triangle",
      acceptButtonProps: { severity: "danger", label: "Delete comment" },
      rejectButtonProps: { label: "Cancel", text: true },
      accept: () => this.deleteMutation.mutate(report.commentId),
    });
  }
}
