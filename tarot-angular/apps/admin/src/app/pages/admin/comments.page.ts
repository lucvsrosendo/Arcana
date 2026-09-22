import { DatePipe } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouteMeta } from "@analogjs/router";
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { newsAuthGuard } from "../../guards/news-auth.guard";
import {
  AdminCommentRecord,
  CommentsAdminService,
} from "../../services/comments-admin.service";

export const routeMeta: RouteMeta = {
  title: "Comments",
  canActivate: [newsAuthGuard],
};

@Component({
  standalone: true,
  providers: [ConfirmationService, MessageService],
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
  ],
  template: `
    <p-toast />
    <p-confirmDialog />

    <header class="page-header">
      <h1>Comments</h1>
      <p>Review community comments and remove policy violations.</p>
    </header>

    <p-toolbar class="mb-4">
      <ng-template pTemplate="start">
        <p-iconfield iconPosition="left">
          <p-inputicon styleClass="pi pi-search" />
          <input
            pInputText
            type="search"
            placeholder="Search author, article, or body"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
          />
        </p-iconfield>
      </ng-template>
      <ng-template pTemplate="end">
        <p-button
          label="Refresh"
          icon="pi pi-refresh"
          [text]="true"
          (onClick)="commentsQuery.refetch()"
        />
      </ng-template>
    </p-toolbar>

    <p-table
      [value]="filteredComments()"
      [loading]="commentsQuery.isPending()"
      [paginator]="true"
      [rows]="15"
      dataKey="id"
      responsiveLayout="scroll"
    >
      <ng-template pTemplate="header">
        <tr>
          <th>Author</th>
          <th>Article</th>
          <th>Comment</th>
          <th>Created</th>
          <th style="width: 6rem">Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-row>
        <tr>
          <td>
            <div>{{ row.authorDisplayName }}</div>
            @if (row.flaggedProfanity) {
              <p-tag severity="warn" value="Profanity" class="mt-1" />
            }
          </td>
          <td>{{ row.newsTitle }}</td>
          <td>{{ row.body }}</td>
          <td>{{ row.createdAt | date: "medium" }}</td>
          <td>
            <p-button
              icon="pi pi-trash"
              severity="danger"
              [rounded]="true"
              [text]="true"
              (onClick)="confirmDelete(row)"
            />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="5">No comments found.</td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export default class AdminCommentsPage {
  private readonly commentsService = inject(CommentsAdminService);
  private readonly queryClient = injectQueryClient();
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly searchTerm = signal("");

  readonly commentsQuery = injectQuery(() => ({
    queryKey: ["admin-comments"],
    queryFn: () => this.commentsService.fetchAllComments(),
  }));

  readonly filteredComments = computed(() => {
    const rows = this.commentsQuery.data() ?? [];
    const query = this.searchTerm().trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter(
      (comment) =>
        comment.authorDisplayName.toLowerCase().includes(query) ||
        comment.newsTitle.toLowerCase().includes(query) ||
        comment.body.toLowerCase().includes(query),
    );
  });

  readonly deleteMutation = injectMutation(() => ({
    mutationFn: (commentId: string) => this.commentsService.deleteComment(commentId),
    onSuccess: () => {
      this.messages.add({ severity: "success", summary: "Comment deleted" });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-engagement"] });
    },
    onError: () => {
      this.messages.add({
        severity: "error",
        summary: "Could not delete comment",
      });
    },
  }));

  confirmDelete(comment: AdminCommentRecord) {
    this.confirmation.confirm({
      header: "Delete comment",
      message: `Remove comment by ${comment.authorDisplayName}?`,
      icon: "pi pi-exclamation-triangle",
      acceptButtonProps: { severity: "danger", label: "Delete" },
      rejectButtonProps: { label: "Cancel", text: true },
      accept: () => this.deleteMutation.mutate(comment.id),
    });
  }
}
