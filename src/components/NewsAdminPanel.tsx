import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useDebounce } from "use-debounce";
import { useDropzone } from "react-dropzone";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { PageShell } from "@/components/layout/PageShell";
import { useToast } from "@/components/ToastProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NewsBodyEditor } from "@/components/news/NewsBodyEditor";
import { NewsCoverCropDialog } from "@/components/news/NewsCoverCropDialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uiCopy } from "@/data/i18n";
import { useTarot } from "@/hooks/useTarot";
import { useNewsRole } from "@/hooks/useNewsRole";
import { formatNewsCloudError } from "@/lib/newsCloud";
import { normalizeNewsMarkdown } from "@/lib/normalizeNewsMarkdown";
import {
  deleteCommentAsAdmin,
  fetchAllCommentsForAdmin,
  type AdminCommentRecord,
} from "@/lib/newsCommentsAdmin";
import {
  dismissCommentReport,
  fetchCommentReports,
  type CommentReportRecord,
} from "@/lib/commentReportsAdmin";

type FormState = {
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
  cover_image_url: string | null;
};

type NewsRecord = FormState & {
  id: string;
  created_at: string;
};

const emptyForm: FormState = {
  date: "",
  tag_pt: "",
  tag_en: "",
  tag_es: "",
  title_pt: "",
  title_en: "",
  title_es: "",
  summary_pt: "",
  summary_en: "",
  summary_es: "",
  body_pt: "",
  body_en: "",
  body_es: "",
  cover_image_url: null,
};

export function NewsAdminPanel() {
  const language = useTarot((state) => state.language);
  const copy = uiCopy[language];
  const { pushToast } = useToast();
  const newsRole = useNewsRole();
  const canManageNews = newsRole.isAdmin || newsRole.isModerator;
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["news", "comments", "reports", "engagement"] as const).withDefault(
      "news",
    ),
  );
  const [commentSearch, setCommentSearch] = useState("");
  const [debouncedCommentSearch] = useDebounce(commentSearch, 300);
  const [previewRecord, setPreviewRecord] = useState<NewsRecord | null>(null);
  const [records, setRecords] = useState<NewsRecord[]>([]);
  const [adminComments, setAdminComments] = useState<AdminCommentRecord[]>([]);
  const [adminReports, setAdminReports] = useState<CommentReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverPreview, setPendingCoverPreview] = useState<string | null>(null);
  const [isCoverBusy, setIsCoverBusy] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);

  const coverPreviewSrc = pendingCoverPreview || form.cover_image_url;
  const isCropOpen = Boolean(cropSourceUrl);

  const clearPendingCover = useCallback(() => {
    setPendingCoverFile(null);
    setPendingCoverPreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const closeCropDialog = useCallback(() => {
    setCropSourceUrl((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const openCropDialog = useCallback((file: File) => {
    setCropSourceUrl((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  }, []);

  const toastCoverError = useCallback(
    (error: unknown) => {
      const code = error instanceof Error ? error.message : "";
      const detailRaw =
        formatNewsCloudError(error) ||
        (error instanceof Error ? error.message : "") ||
        (typeof error === "object" &&
        error &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "");
      const detailLower = detailRaw.toLowerCase();
      let message = copy.newsCoverError;

      if (code === "cover-too-large") {
        message = copy.newsCoverTooLarge;
      } else if (code === "invalid-cover-type") {
        message = copy.newsCoverInvalidType;
      } else if (code === "cover-column-missing") {
        message = copy.newsCoverColumnMissing;
      } else if (
        detailLower.includes("bucket not found") ||
        (detailLower.includes("not found") && detailLower.includes("news-images"))
      ) {
        message = copy.newsCoverBucketMissing;
      } else if (
        detailLower.includes("row-level security") ||
        detailLower.includes("violates row-level security")
      ) {
        message = copy.newsCoverRlsDenied;
      } else if (detailRaw) {
        message = `${copy.newsCoverError} ${detailRaw}`;
      }

      pushToast(message, "error");
    },
    [
      copy.newsCoverBucketMissing,
      copy.newsCoverColumnMissing,
      copy.newsCoverError,
      copy.newsCoverInvalidType,
      copy.newsCoverRlsDenied,
      copy.newsCoverTooLarge,
      pushToast,
    ],
  );

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const module = await import("@/lib/newsCloud");
      const raw = await module.fetchCloudNewsRaw();
      setRecords(
        raw.map((row) => ({
          id: row.id,
          created_at: row.created_at,
          date: row.date,
          tag_pt: row.tag_pt,
          tag_en: row.tag_en,
          tag_es: row.tag_es,
          title_pt: row.title_pt,
          title_en: row.title_en,
          title_es: row.title_es,
          summary_pt: row.summary_pt,
          summary_en: row.summary_en,
          summary_es: row.summary_es,
          body_pt: row.body_pt ?? "",
          body_en: row.body_en ?? "",
          body_es: row.body_es ?? "",
          cover_image_url: row.cover_image_url ?? null,
        })),
      );
    } catch (error) {
      console.error(error);
      pushToast(copy.newsLoadError, "error");
    } finally {
      setIsLoading(false);
    }
  }, [copy.newsLoadError, pushToast]);

  const handleCoverFile = useCallback(
    async (file: File | null) => {
      if (!file || !canManageNews) {
        return;
      }

      if (editingId) {
        setIsCoverBusy(true);
        try {
          const { uploadNewsCover } = await import("@/lib/newsCoverCloud");
          const url = await uploadNewsCover(editingId, file);
          clearPendingCover();
          setForm((current) => ({ ...current, cover_image_url: url }));
          await loadRecords();
        } catch (error) {
          console.error(error);
          toastCoverError(error);
        } finally {
          setIsCoverBusy(false);
        }
        return;
      }

      clearPendingCover();
      const preview = URL.createObjectURL(file);
      setPendingCoverFile(file);
      setPendingCoverPreview(preview);
    },
    [canManageNews, clearPendingCover, editingId, loadRecords, toastCoverError],
  );

  const handleRemoveCover = useCallback(async () => {
    if (!canManageNews) {
      return;
    }

    if (editingId && form.cover_image_url) {
      setIsCoverBusy(true);
      try {
        const { removeNewsCover } = await import("@/lib/newsCoverCloud");
        await removeNewsCover(editingId, form.cover_image_url);
        setForm((current) => ({ ...current, cover_image_url: null }));
        clearPendingCover();
        await loadRecords();
      } catch (error) {
        console.error(error);
        toastCoverError(error);
      } finally {
        setIsCoverBusy(false);
      }
      return;
    }

    clearPendingCover();
    setForm((current) => ({ ...current, cover_image_url: null }));
  }, [
    canManageNews,
    clearPendingCover,
    editingId,
    form.cover_image_url,
    loadRecords,
    toastCoverError,
  ]);

  const coverDropzone = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: !canManageNews || isCoverBusy,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file || !canManageNews) {
        return;
      }
      openCropDialog(file);
    },
  });

  const loadComments = useCallback(async () => {
    setIsCommentsLoading(true);
    try {
      const comments = await fetchAllCommentsForAdmin();
      setAdminComments(comments);
    } catch (error) {
      console.error(error);
      pushToast(copy.newsCommentLoadError, "error");
    } finally {
      setIsCommentsLoading(false);
    }
  }, [copy.newsCommentLoadError, pushToast]);

  const loadReports = useCallback(async () => {
    setIsReportsLoading(true);
    try {
      const reports = await fetchCommentReports();
      setAdminReports(reports);
    } catch (error) {
      console.error(error);
      pushToast(copy.newsCommentLoadError, "error");
    } finally {
      setIsReportsLoading(false);
    }
  }, [copy.newsCommentLoadError, pushToast]);

  useEffect(() => {
    void loadRecords();
    void loadReports();
  }, [loadRecords, loadReports]);

  useEffect(() => {
    if (activeTab !== "comments" && activeTab !== "engagement") {
      return;
    }
    void loadComments();
  }, [activeTab, loadComments]);

  const filteredAdminComments = useMemo(() => {
    const query = debouncedCommentSearch.trim().toLowerCase();
    if (!query) {
      return adminComments;
    }

    return adminComments.filter(
      (comment) =>
        comment.authorDisplayName.toLowerCase().includes(query) ||
        comment.newsTitle.toLowerCase().includes(query) ||
        comment.body.toLowerCase().includes(query),
    );
  }, [adminComments, debouncedCommentSearch]);

  const engagementRanking = useMemo(() => {
    const counts = new Map<string, number>();

    for (const comment of adminComments) {
      counts.set(comment.newsTitle, (counts.get(comment.newsTitle) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [adminComments]);

  const buildPayload = () => ({
    date: form.date,
    tag: {
      pt: form.tag_pt || "Noticias",
      en: form.tag_en || form.tag_pt || "News",
      es: form.tag_es || form.tag_pt || "Noticias",
    },
    title: {
      pt: form.title_pt,
      en: form.title_en || form.title_pt,
      es: form.title_es || form.title_pt,
    },
    summary: {
      pt: form.summary_pt,
      en: form.summary_en || form.summary_pt,
      es: form.summary_es || form.summary_pt,
    },
    body: {
      pt: form.body_pt,
      en: form.body_en || form.body_pt,
      es: form.body_es || form.body_pt,
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageNews) {
      pushToast(copy.newsAdminPermissionError, "error");
      return;
    }

    try {
      const module = await import("@/lib/newsCloud");
      if (editingId) {
        await module.updateNewsInCloud(editingId, {
          ...buildPayload(),
          coverImageUrl: form.cover_image_url,
        });
        pushToast(copy.newsUpdated, "success");
      } else {
        const createdId = await module.saveNewsToCloud(buildPayload());
        if (createdId && pendingCoverFile) {
          try {
            const { uploadNewsCover } = await import("@/lib/newsCoverCloud");
            await uploadNewsCover(createdId, pendingCoverFile);
          } catch (coverError) {
            console.error(coverError);
            toastCoverError(coverError);
          }
        }
        pushToast(copy.newsCreated, "success");
      }

      clearPendingCover();
      setForm(emptyForm);
      setEditingId(null);
      await loadRecords();
    } catch (error) {
      console.error(error);
      const detail = formatNewsCloudError(error);
      pushToast(detail ? `${copy.newsSaveError} ${detail}` : copy.newsSaveError, "error");
    }
  };

  const handleEdit = (record: NewsRecord) => {
    clearPendingCover();
    setEditingId(record.id);
    setForm({
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
      body_pt: record.body_pt ?? "",
      body_en: record.body_en ?? "",
      body_es: record.body_es ?? "",
      cover_image_url: record.cover_image_url ?? null,
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const module = await import("@/lib/newsCloud");
      await module.deleteNewsFromCloud(id);
      pushToast(copy.newsDeleted, "success");
      await loadRecords();
    } catch (error) {
      console.error(error);
      pushToast(copy.newsDeleteError, "error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentAsAdmin(commentId);
      pushToast(copy.newsCommentDeleted, "success");
      await loadComments();
    } catch (error) {
      console.error(error);
      pushToast(copy.newsCommentSaveError, "error");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    clearPendingCover();
    setForm(emptyForm);
  };

  return (
    <PageShell className="news-admin-page">
      <div className="news-admin-shell">
        <header className="news-admin-hero">
          <p className="text-minimal mb-4 text-muted-foreground">{copy.newsModeration}</p>
          <h1 className="font-display text-architectural text-4xl font-light md:text-6xl">
            {copy.newsPanelTitle}
          </h1>
          <p className="news-admin-hero-lede">{copy.newsPanelIntro}</p>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(value) => void setActiveTab(value as typeof activeTab)}
          className="news-admin-tabs"
        >
          <TabsList>
            <TabsTrigger value="news">{copy.newsAdminTabNews}</TabsTrigger>
            <TabsTrigger value="comments">{copy.newsAdminTabComments}</TabsTrigger>
            <TabsTrigger value="reports">
              {copy.newsAdminTabReports}
              {adminReports.length > 0 ? (
                <span className="news-admin-tab-badge">{adminReports.length}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="engagement">{copy.newsAdminTabEngagement}</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="news-admin-tab-panel">
            <div className="news-admin-news-layout">
              <section className="news-admin-cabinet news-admin-compose">
                <header className="news-admin-rail-block news-admin-rail-head">
                  <p className="news-admin-rail-kicker">
                    {editingId ? copy.updateNews : copy.publishNews}
                  </p>
                  {editingId ? (
                    <button type="button" className="news-admin-quiet-action" onClick={resetForm}>
                      {copy.cancelEdit}
                    </button>
                  ) : null}
                </header>

                <form className="news-admin-rail-block news-admin-form" onSubmit={handleSubmit}>
                  <div className="news-admin-field-grid">
                    <label className="news-admin-field">
                      <span>{copy.newsDateLabel}</span>
                      <input
                        id="news-date"
                        value={form.date}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, date: event.target.value }))
                        }
                        className="news-admin-input"
                        placeholder="06/06/2026"
                        required
                      />
                    </label>
                    <label className="news-admin-field">
                      <span>{copy.newsTagPt}</span>
                      <input
                        id="news-tag-pt"
                        value={form.tag_pt}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, tag_pt: event.target.value }))
                        }
                        className="news-admin-input"
                        placeholder="IA"
                      />
                    </label>
                    <label className="news-admin-field">
                      <span>{copy.newsTagEn}</span>
                      <input
                        id="news-tag-en"
                        value={form.tag_en}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, tag_en: event.target.value }))
                        }
                        className="news-admin-input"
                      />
                    </label>
                    <label className="news-admin-field">
                      <span>{copy.newsTagEs}</span>
                      <input
                        id="news-tag-es"
                        value={form.tag_es}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, tag_es: event.target.value }))
                        }
                        className="news-admin-input"
                      />
                    </label>
                  </div>

                  <label className="news-admin-field">
                    <span>{copy.newsTitlePt}</span>
                    <input
                      id="news-title-pt"
                      value={form.title_pt}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title_pt: event.target.value }))
                      }
                      className="news-admin-input"
                      required
                    />
                  </label>

                  <label className="news-admin-field">
                    <span>{copy.newsSummaryPt}</span>
                    <textarea
                      id="news-summary-pt"
                      value={form.summary_pt}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, summary_pt: event.target.value }))
                      }
                      className="news-admin-input news-admin-input--area"
                      rows={3}
                      required
                    />
                  </label>

                  <div className="news-admin-field news-admin-cover-field">
                    <span>{copy.newsCoverLabel}</span>
                    <p className="news-admin-cover-hint">{copy.newsCoverHint}</p>
                    {coverPreviewSrc ? (
                      <div className="news-admin-cover-preview">
                        <img src={coverPreviewSrc} alt="" />
                      </div>
                    ) : null}
                    <div className="news-admin-cover-actions">
                      <div
                        {...coverDropzone.getRootProps()}
                        className={[
                          "news-admin-cover-drop",
                          coverDropzone.isDragActive ? "is-active" : "",
                        ].join(" ")}
                      >
                        <input {...coverDropzone.getInputProps()} />
                        <button type="button" className="news-admin-quiet-action" disabled={isCoverBusy}>
                          {copy.newsCoverUpload}
                        </button>
                      </div>
                      {coverPreviewSrc ? (
                        <button
                          type="button"
                          className="news-admin-quiet-action"
                          disabled={isCoverBusy}
                          onClick={() => void handleRemoveCover()}
                        >
                          {copy.newsCoverRemove}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <NewsCoverCropDialog
                    open={isCropOpen}
                    imageSrc={cropSourceUrl}
                    title={copy.newsCoverCropTitle}
                    hint={copy.newsCoverCropHint}
                    zoomLabel={copy.newsCoverCropZoom}
                    applyLabel={copy.newsCoverCropApply}
                    cancelLabel={copy.newsCoverCropCancel}
                    onOpenChange={(open) => {
                      if (!open) {
                        closeCropDialog();
                      }
                    }}
                    onCropped={(file) => {
                      closeCropDialog();
                      void handleCoverFile(file);
                    }}
                    onError={(error) => {
                      console.error(error);
                      toastCoverError(error);
                    }}
                  />

                  <div className="news-admin-field">
                    <span>{copy.newsBodyPt}</span>
                    <NewsBodyEditor
                      value={form.body_pt}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, body_pt: value }))
                      }
                      className="news-admin-editor"
                    />
                  </div>

                  <Accordion type="single" collapsible className="news-admin-translations">
                    <AccordionItem value="translations" className="border-b-0">
                      <AccordionTrigger className="news-admin-translations-trigger hover:no-underline">
                        {copy.newsTranslations}
                      </AccordionTrigger>
                      <AccordionContent className="news-admin-translations-body">
                        <label className="news-admin-field">
                          <span>{copy.newsTitleEn}</span>
                          <input
                            id="news-title-en"
                            value={form.title_en}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                title_en: event.target.value,
                              }))
                            }
                            className="news-admin-input"
                          />
                        </label>
                        <label className="news-admin-field">
                          <span>{copy.newsSummaryEn}</span>
                          <textarea
                            id="news-summary-en"
                            value={form.summary_en}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                summary_en: event.target.value,
                              }))
                            }
                            className="news-admin-input news-admin-input--area"
                            rows={3}
                          />
                        </label>
                        <div className="news-admin-field">
                          <span>{copy.newsBodyEn}</span>
                          <NewsBodyEditor
                            value={form.body_en}
                            onChange={(value) =>
                              setForm((current) => ({ ...current, body_en: value }))
                            }
                            className="news-admin-editor"
                          />
                        </div>
                        <label className="news-admin-field">
                          <span>{copy.newsTitleEs}</span>
                          <input
                            id="news-title-es"
                            value={form.title_es}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                title_es: event.target.value,
                              }))
                            }
                            className="news-admin-input"
                          />
                        </label>
                        <label className="news-admin-field">
                          <span>{copy.newsSummaryEs}</span>
                          <textarea
                            id="news-summary-es"
                            value={form.summary_es}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                summary_es: event.target.value,
                              }))
                            }
                            className="news-admin-input news-admin-input--area"
                            rows={3}
                          />
                        </label>
                        <div className="news-admin-field">
                          <span>{copy.newsBodyEs}</span>
                          <NewsBodyEditor
                            value={form.body_es}
                            onChange={(value) =>
                              setForm((current) => ({ ...current, body_es: value }))
                            }
                            className="news-admin-editor"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="news-admin-form-actions">
                    <button type="submit" className="news-admin-submit">
                      {editingId ? copy.updateNews : copy.publishNews}
                    </button>
                  </div>
                </form>
              </section>

              <section className="news-admin-cabinet news-admin-cabinet--stack news-admin-stream">
                <header className="news-admin-rail-block news-admin-rail-head">
                  <p className="news-admin-rail-kicker">{copy.latestNews}</p>
                  <p className="news-admin-count">
                    <span className="news-admin-count-value">{records.length}</span>
                  </p>
                </header>

                <div className="news-admin-rail-block">
                  {isLoading ? (
                    <p className="news-admin-empty">{copy.loadingShort}</p>
                  ) : records.length === 0 ? (
                    <p className="news-admin-empty">{copy.newsAdminEmpty}</p>
                  ) : (
                    <ul className="news-admin-item-list">
                      {records.map((record, index) => (
                        <li key={record.id} className="news-admin-item">
                          <span className="news-admin-item-mark" aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="news-admin-item-main">
                            <div className="news-admin-item-meta">
                              <time>{record.date}</time>
                              {record.tag_pt ? (
                                <span className="news-admin-item-tag">{record.tag_pt}</span>
                              ) : null}
                            </div>
                            <h3 className="news-admin-item-title">{record.title_pt}</h3>
                            <p className="news-admin-item-summary">{record.summary_pt}</p>
                            <div className="news-admin-item-actions">
                              <button
                                type="button"
                                className="news-admin-quiet-action"
                                onClick={() => setPreviewRecord(record)}
                              >
                                {copy.newsAdminPreview}
                              </button>
                              <button
                                type="button"
                                className="news-admin-quiet-action"
                                onClick={() => handleEdit(record)}
                              >
                                {copy.edit}
                              </button>
                              <button
                                type="button"
                                className="news-admin-quiet-action is-danger"
                                onClick={() => void handleDelete(record.id)}
                              >
                                {copy.delete}
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="news-admin-tab-panel">
            <section className="news-admin-cabinet news-admin-cabinet--stack">
              <header className="news-admin-rail-block news-admin-rail-head">
                <div>
                  <p className="news-admin-rail-kicker">{copy.newsAdminCommentsTitle}</p>
                </div>
              </header>
              <div className="news-admin-rail-block">
                <label className="news-admin-field news-admin-search">
                  <span className="sr-only">{copy.newsAdminCommentSearch}</span>
                  <input
                    value={commentSearch}
                    onChange={(event) => setCommentSearch(event.target.value)}
                    className="news-admin-input"
                    placeholder={copy.newsAdminCommentSearch}
                  />
                </label>
              </div>
              <div className="news-admin-rail-block">
                {isCommentsLoading ? (
                  <p className="news-admin-empty">{copy.loadingShort}</p>
                ) : filteredAdminComments.length === 0 ? (
                  <p className="news-admin-empty">{copy.newsAdminCommentsEmpty}</p>
                ) : (
                  <ul className="news-admin-item-list">
                    {filteredAdminComments.map((comment, index) => (
                      <li key={comment.id} className="news-admin-item">
                        <span className="news-admin-item-mark" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="news-admin-item-main">
                          <div className="news-admin-item-meta">
                            <span>{comment.authorDisplayName}</span>
                            <time dateTime={comment.createdAt}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                          <p className="news-admin-item-article">{comment.newsTitle}</p>
                          <p className="news-admin-item-summary">{comment.body}</p>
                          <div className="news-admin-item-actions">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button type="button" className="news-admin-quiet-action is-danger">
                                  {copy.delete}
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {copy.newsCommentDeleteConfirm}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>{comment.body}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{copy.newsCommentCancel}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => void handleDeleteComment(comment.id)}
                                  >
                                    {copy.delete}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="reports" className="news-admin-tab-panel">
            <section className="news-admin-cabinet news-admin-cabinet--stack">
              <header className="news-admin-rail-block news-admin-rail-head">
                <p className="news-admin-rail-kicker">{copy.newsAdminReportsTitle}</p>
                {adminReports.length > 0 ? (
                  <p className="news-admin-count">
                    <span className="news-admin-count-value">{adminReports.length}</span>
                  </p>
                ) : null}
              </header>
              <div className="news-admin-rail-block">
                {isReportsLoading ? (
                  <p className="news-admin-empty">{copy.loadingShort}</p>
                ) : adminReports.length === 0 ? (
                  <p className="news-admin-empty">{copy.newsAdminReportsEmpty}</p>
                ) : (
                  <ul className="news-admin-item-list">
                    {adminReports.map((report, index) => (
                      <li key={report.id} className="news-admin-item">
                        <span className="news-admin-item-mark" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="news-admin-item-main">
                          <div className="news-admin-item-meta">
                            <span>{report.commentAuthor}</span>
                            <time>{report.createdAt}</time>
                          </div>
                          <h3 className="news-admin-item-title">{report.newsTitle}</h3>
                          <p className="news-admin-item-summary">{report.commentBody}</p>
                          <p className="news-admin-item-reason">
                            <span>{copy.newsAdminReportReason}</span> {report.reason}
                          </p>
                          <div className="news-admin-item-actions">
                            <button
                              type="button"
                              className="news-admin-quiet-action"
                              onClick={() => {
                                void dismissCommentReport(report.id).then(() => {
                                  void loadReports();
                                  pushToast(copy.newsAdminReportDismissed, "success");
                                });
                              }}
                            >
                              {copy.newsAdminReportDismiss}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="engagement" className="news-admin-tab-panel">
            <section className="news-admin-cabinet news-admin-cabinet--stack">
              <header className="news-admin-rail-block news-admin-rail-head">
                <p className="news-admin-rail-kicker">{copy.newsAdminEngagementTitle}</p>
              </header>
              <div className="news-admin-rail-block">
                {isCommentsLoading ? (
                  <p className="news-admin-empty">{copy.loadingShort}</p>
                ) : engagementRanking.length === 0 ? (
                  <p className="news-admin-empty">{copy.newsCommentsEmpty}</p>
                ) : (
                  <ol className="news-admin-ranking">
                    {engagementRanking.map((item, index) => (
                      <li key={item.title}>
                        <span className="news-admin-item-mark" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="news-admin-ranking-title">{item.title}</span>
                        <span className="news-admin-ranking-count">{item.count}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          </TabsContent>
        </Tabs>

        <Sheet
          open={Boolean(previewRecord)}
          onOpenChange={(open) => !open && setPreviewRecord(null)}
        >
          <SheetContent side="right" className="news-admin-preview w-full overflow-y-auto sm:max-w-xl">
            {previewRecord ? (
              <>
                <SheetHeader>
                  <SheetDescription>{previewRecord.date}</SheetDescription>
                  <SheetTitle className="font-display text-2xl font-light">
                    {previewRecord.title_pt}
                  </SheetTitle>
                </SheetHeader>
                <p className="news-admin-preview-summary">{previewRecord.summary_pt}</p>
                {previewRecord.body_pt ? (
                  <article className="editorial-prose mt-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {normalizeNewsMarkdown(previewRecord.body_pt)}
                    </ReactMarkdown>
                  </article>
                ) : null}
              </>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </PageShell>
  );
}
