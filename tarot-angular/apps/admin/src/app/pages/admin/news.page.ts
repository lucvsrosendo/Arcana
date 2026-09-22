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
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { newsAuthGuard } from "../../guards/news-auth.guard";
import {
  NewsAdminService,
  NewsPayload,
  NewsRecord,
} from "../../services/news-admin.service";

type NewsFormState = {
  date: string;
  tag_pt: string;
  tag_en: string;
  tag_es: string;
  title_pt: string;
  title_en: string;
  title_es: string;
  summary_pt: string;
  summary_en: string;
  summary_es: string;
  body_pt: string;
  body_en: string;
  body_es: string;
};

const emptyForm = (): NewsFormState => ({
  date: new Date().toISOString().slice(0, 10),
  tag_pt: "Noticias",
  tag_en: "News",
  tag_es: "Noticias",
  title_pt: "",
  title_en: "",
  title_es: "",
  summary_pt: "",
  summary_en: "",
  summary_es: "",
  body_pt: "",
  body_en: "",
  body_es: "",
});

export const routeMeta: RouteMeta = {
  title: "News",
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
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToolbarModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  template: `
    <p-toast />
    <p-confirmDialog />

    <header class="page-header">
      <h1>News</h1>
      <p>Create, edit, and remove site news articles.</p>
    </header>

    <p-toolbar class="mb-4">
      <ng-template pTemplate="start">
        <p-button label="New article" icon="pi pi-plus" (onClick)="openCreate()" />
      </ng-template>
      <ng-template pTemplate="end">
        <p-button
          label="Refresh"
          icon="pi pi-refresh"
          [text]="true"
          (onClick)="newsQuery.refetch()"
        />
      </ng-template>
    </p-toolbar>

    <p-table
      [value]="newsQuery.data() ?? []"
      [loading]="newsQuery.isPending()"
      [paginator]="true"
      [rows]="10"
      dataKey="id"
      responsiveLayout="scroll"
    >
      <ng-template #header>
        <tr>
          <th>Date</th>
          <th>Title (PT)</th>
          <th>Summary (PT)</th>
          <th>Created</th>
          <th style="width: 9rem">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-row>
        <tr>
          <td>{{ row.date }}</td>
          <td>{{ row.title_pt }}</td>
          <td>{{ row.summary_pt }}</td>
          <td>{{ row.created_at | date: "medium" }}</td>
          <td>
            <div class="flex gap-2">
              <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (onClick)="openEdit(row)" />
              <p-button
                icon="pi pi-trash"
                severity="danger"
                [rounded]="true"
                [text]="true"
                (onClick)="confirmDelete(row)"
              />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr>
          <td colspan="5">No articles yet.</td>
        </tr>
      </ng-template>
    </p-table>

    <p-dialog
      [header]="editingId() ? 'Edit article' : 'New article'"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: 'min(960px, 96vw)' }"
    >
      <div class="form-grid">
        <div class="form-field">
          <label for="date">Date</label>
          <input
            id="date"
            pInputText
            [ngModel]="formValue('date')"
            (ngModelChange)="patchForm('date', $event)"
          />
        </div>
        <div class="form-field">
          <label for="tag-pt">Tag (PT)</label>
          <input
            id="tag-pt"
            pInputText
            [ngModel]="formValue('tag_pt')"
            (ngModelChange)="patchForm('tag_pt', $event)"
          />
        </div>
        <div class="form-field">
          <label for="tag-en">Tag (EN)</label>
          <input
            id="tag-en"
            pInputText
            [ngModel]="formValue('tag_en')"
            (ngModelChange)="patchForm('tag_en', $event)"
          />
        </div>
        <div class="form-field">
          <label for="tag-es">Tag (ES)</label>
          <input
            id="tag-es"
            pInputText
            [ngModel]="formValue('tag_es')"
            (ngModelChange)="patchForm('tag_es', $event)"
          />
        </div>
        <div class="form-field form-field-full">
          <label for="title-pt">Title (PT)</label>
          <input
            id="title-pt"
            pInputText
            [ngModel]="formValue('title_pt')"
            (ngModelChange)="patchForm('title_pt', $event)"
          />
        </div>
        <div class="form-field">
          <label for="title-en">Title (EN)</label>
          <input
            id="title-en"
            pInputText
            [ngModel]="formValue('title_en')"
            (ngModelChange)="patchForm('title_en', $event)"
          />
        </div>
        <div class="form-field">
          <label for="title-es">Title (ES)</label>
          <input
            id="title-es"
            pInputText
            [ngModel]="formValue('title_es')"
            (ngModelChange)="patchForm('title_es', $event)"
          />
        </div>
        <div class="form-field form-field-full">
          <label for="summary-pt">Summary (PT)</label>
          <textarea
            id="summary-pt"
            pTextarea
            rows="3"
            [ngModel]="formValue('summary_pt')"
            (ngModelChange)="patchForm('summary_pt', $event)"
          ></textarea>
        </div>
        <div class="form-field">
          <label for="summary-en">Summary (EN)</label>
          <textarea
            id="summary-en"
            pTextarea
            rows="3"
            [ngModel]="formValue('summary_en')"
            (ngModelChange)="patchForm('summary_en', $event)"
          ></textarea>
        </div>
        <div class="form-field">
          <label for="summary-es">Summary (ES)</label>
          <textarea
            id="summary-es"
            pTextarea
            rows="3"
            [ngModel]="formValue('summary_es')"
            (ngModelChange)="patchForm('summary_es', $event)"
          ></textarea>
        </div>
        <div class="form-field form-field-full">
          <label for="body-pt">Body markdown (PT)</label>
          <textarea
            id="body-pt"
            pTextarea
            rows="8"
            [ngModel]="formValue('body_pt')"
            (ngModelChange)="patchForm('body_pt', $event)"
          ></textarea>
        </div>
        <div class="form-field">
          <label for="body-en">Body markdown (EN)</label>
          <textarea
            id="body-en"
            pTextarea
            rows="8"
            [ngModel]="formValue('body_en')"
            (ngModelChange)="patchForm('body_en', $event)"
          ></textarea>
        </div>
        <div class="form-field">
          <label for="body-es">Body markdown (ES)</label>
          <textarea
            id="body-es"
            pTextarea
            rows="8"
            [ngModel]="formValue('body_es')"
            (ngModelChange)="patchForm('body_es', $event)"
          ></textarea>
        </div>
      </div>

      <ng-template #footer>
        <p-button label="Cancel" [text]="true" (onClick)="closeDialog()" />
        <p-button
          [label]="editingId() ? 'Save changes' : 'Create article'"
          icon="pi pi-check"
          [loading]="saveMutation.isPending()"
          (onClick)="saveArticle()"
        />
      </ng-template>
    </p-dialog>
  `,
})
export default class AdminNewsPage {
  private readonly newsService = inject(NewsAdminService);
  private readonly queryClient = injectQueryClient();
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly form = signal<NewsFormState>(emptyForm());
  readonly editingId = signal<string | null>(null);
  dialogVisible = false;

  patchForm<K extends keyof NewsFormState>(key: K, value: NewsFormState[K]) {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  formValue(key: keyof NewsFormState) {
    return this.form()[key];
  }

  readonly newsQuery = injectQuery(() => ({
    queryKey: ["admin-news"],
    queryFn: () => this.newsService.fetchAll(),
  }));

  readonly saveMutation = injectMutation(() => ({
    mutationFn: async () => {
      const payload = this.buildPayload();
      const editingId = this.editingId();

      if (editingId) {
        await this.newsService.update(editingId, payload);
        return "updated";
      }

      await this.newsService.create(payload);
      return "created";
    },
    onSuccess: (result) => {
      this.messages.add({
        severity: "success",
        summary: result === "updated" ? "Article updated" : "Article created",
      });
      this.closeDialog();
      void this.queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => {
      this.messages.add({
        severity: "error",
        summary: "Could not save article",
      });
    },
  }));

  readonly deleteMutation = injectMutation(() => ({
    mutationFn: (newsId: string) => this.newsService.remove(newsId),
    onSuccess: () => {
      this.messages.add({ severity: "success", summary: "Article deleted" });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      void this.queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => {
      this.messages.add({
        severity: "error",
        summary: "Could not delete article",
      });
    },
  }));

  openCreate() {
    this.editingId.set(null);
    this.form.set(emptyForm());
    this.dialogVisible = true;
  }

  openEdit(record: NewsRecord) {
    this.editingId.set(record.id);
    this.form.set({
      date: record.date,
      tag_pt: record.tag_pt,
      tag_en: record.tag_en,
      tag_es: record.tag_es,
      title_pt: record.title_pt,
      title_en: record.title_en,
      title_es: record.title_es,
      summary_pt: record.summary_pt,
      summary_en: record.summary_en,
      summary_es: record.summary_es,
      body_pt: record.body_pt,
      body_en: record.body_en,
      body_es: record.body_es,
    });
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
    this.editingId.set(null);
    this.form.set(emptyForm());
  }

  saveArticle() {
    const current = this.form();
    if (!current.title_pt.trim() || !current.summary_pt.trim()) {
      this.messages.add({
        severity: "warn",
        summary: "Portuguese title and summary are required",
      });
      return;
    }

    this.saveMutation.mutate();
  }

  confirmDelete(record: NewsRecord) {
    this.confirmation.confirm({
      header: "Delete article",
      message: `Remove "${record.title_pt}"?`,
      icon: "pi pi-exclamation-triangle",
      acceptButtonProps: { severity: "danger", label: "Delete" },
      rejectButtonProps: { label: "Cancel", text: true },
      accept: () => this.deleteMutation.mutate(record.id),
    });
  }

  private buildPayload(): NewsPayload {
    const current = this.form();

    return {
      date: current.date,
      tag: {
        pt: current.tag_pt || "Noticias",
        en: current.tag_en || current.tag_pt || "News",
        es: current.tag_es || current.tag_pt || "Noticias",
      },
      title: {
        pt: current.title_pt,
        en: current.title_en || current.title_pt,
        es: current.title_es || current.title_pt,
      },
      summary: {
        pt: current.summary_pt,
        en: current.summary_en || current.summary_pt,
        es: current.summary_es || current.summary_pt,
      },
      body: {
        pt: current.body_pt,
        en: current.body_en || current.body_pt,
        es: current.body_es || current.body_pt,
      },
    };
  }
}
