import { motion, useReducedMotion } from "motion/react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Shield,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ZenEmpty } from "@/components/zen/ZenEmpty";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { localizeReadingRecord, uiCopy } from "../data/i18n";
import { formatAppDate } from "../lib/formatDate";
import { buildJournalChatContext } from "../lib/chatContext";
import { useTarot } from "../hooks/useTarot";

const JOURNAL_PAGE_SIZE = 6;

export function JournalPage() {
  const journal = useTarot((state) => state.journal);
  const history = useTarot((state) => state.history);
  const addJournalEntry = useTarot((state) => state.addJournalEntry);
  const updateJournalEntry = useTarot((state) => state.updateJournalEntry);
  const deleteJournalEntry = useTarot((state) => state.deleteJournalEntry);
  const language = useTarot((state) => state.language);
  const copy = uiCopy[language];
  const reduceMotion = useReducedMotion();
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [manifestation, setManifestation] = useState("");
  const [linkedReadingId, setLinkedReadingId] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tagsDraft, setTagsDraft] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const historyById = useMemo(
    () => new Map(history.map((record) => [record.id, record])),
    [history],
  );
  const filteredJournal = useMemo(
    () =>
      journal.filter((entry) => {
        const matchesTag = tagFilter
          ? (entry.tags ?? []).some((tag) =>
              tag.toLocaleLowerCase().includes(tagFilter.toLocaleLowerCase()),
            )
          : true;
        const matchesDate = filterDate
          ? new Date(entry.createdAt).toDateString() === filterDate.toDateString()
          : true;

        return matchesTag && matchesDate;
      }),
    [journal, tagFilter, filterDate],
  );
  const totalPages = Math.max(1, Math.ceil(filteredJournal.length / JOURNAL_PAGE_SIZE));
  const journalCountLabel = {
    pt: journal.length === 1 ? "anotação" : "anotações",
    en: journal.length === 1 ? "note" : "notes",
    es: journal.length === 1 ? "anotación" : "anotaciones",
  }[language];
  const visibleJournal = useMemo(() => {
    const startIndex = (currentPage - 1) * JOURNAL_PAGE_SIZE;
    return filteredJournal.slice(startIndex, startIndex + JOURNAL_PAGE_SIZE);
  }, [currentPage, filteredJournal]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setManifestation("");
    setLinkedReadingId("");
    setTagsDraft("");
    setEditingEntryId(null);
    setOracleError(null);
  };

  const focusCompose = () => {
    notesRef.current?.focus();
    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const startEditing = (entryId: string) => {
    const entry = journal.find((item) => item.id === entryId);

    if (!entry) {
      return;
    }

    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setManifestation(entry.manifestation ?? "");
    setTagsDraft((entry.tags ?? []).join(", "));
    setLinkedReadingId(entry.linkedReadingId ?? "");
    setOracleError(null);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    window.setTimeout(() => notesRef.current?.focus(), 280);
  };

  const requestOracleVision = async () => {
    const linkedReading = historyById.get(linkedReadingId);

    if (!linkedReading) {
      setOracleError(copy.oracleVisionNoReading);
      return;
    }

    const localizedReading = localizeReadingRecord(linkedReading, language);
    setIsOracleLoading(true);
    setOracleError(null);

    try {
      const { streamChatReply } = await import("../lib/chatStream");
      const oracleReply = await streamChatReply(
        {
          context: buildJournalChatContext(
            language,
            {
              id: linkedReading.spreadId,
              title: localizedReading.spreadTitle,
            },
            localizedReading.cards.map((card) => ({
              position: card.position,
              cardName: card.cardName,
              number: card.number,
            })),
            content,
            manifestation,
          ),
          messages: [
            {
              role: "user",
              content: copy.oracleVisionPrompt,
            },
          ],
        },
        () => undefined,
      );

      setContent((currentContent) =>
        currentContent.trim()
          ? `${currentContent.trim()}\n\n${oracleReply}`
          : oracleReply,
      );
      notesRef.current?.focus();
    } catch (error) {
      setOracleError(error instanceof Error ? error.message : copy.chatError);
    } finally {
      setIsOracleLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!content.trim()) {
      notesRef.current?.focus();
      return;
    }

    const entryPayload = {
      title: title.trim() || copy.untitledImpression,
      content: content.trim(),
      manifestation: manifestation.trim() || undefined,
      linkedReadingId: linkedReadingId || undefined,
      tags: tagsDraft
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };

    if (editingEntryId) {
      updateJournalEntry(editingEntryId, entryPayload);
    } else {
      addJournalEntry(entryPayload);
    }

    resetForm();
    setCurrentPage(1);
  };

  const entryIndexOffset = (currentPage - 1) * JOURNAL_PAGE_SIZE;

  return (
    <PageShell>
      <div className="journal-page">
        <header className="journal-hero">
          <h1 className="font-display text-3xl font-light tracking-[-0.02em] md:text-5xl">
            {copy.tarotJournal}
          </h1>
          <p className="journal-hero-lede">{copy.journalSubtitle}</p>
          <p className="journal-hero-lede is-secondary">{copy.emptyJournalText}</p>
        </header>

        <div className="journal-layout">
          <aside className="journal-compose">
            <header className="journal-compose-head">
              <p className="journal-rail-kicker">
                {editingEntryId ? copy.updateEntry : copy.registerInJournal}
              </p>
              {editingEntryId ? (
                <button type="button" className="journal-quiet-action" onClick={resetForm}>
                  {copy.cancel}
                </button>
              ) : null}
            </header>

            <form className="journal-form" onSubmit={handleSubmit}>
              <label className="journal-field">
                <span>{copy.title}</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="journal-input"
                  placeholder={copy.titlePlaceholder}
                />
              </label>

              <div className="journal-form-grid">
                <label className="journal-field">
                  <span>{copy.linkedReading}</span>
                  <select
                    value={linkedReadingId}
                    onChange={(event) => {
                      setLinkedReadingId(event.target.value);
                      setOracleError(null);
                    }}
                    className="journal-input"
                  >
                    <option value="">{copy.noLink}</option>
                    {history.slice(0, 20).map((record) => (
                      <option key={record.id} value={record.id}>
                        {localizeReadingRecord(record, language).spreadTitle} -{" "}
                        {formatAppDate(record.createdAt, language)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="journal-field">
                  <span>{copy.tagsLabel}</span>
                  <input
                    value={tagsDraft}
                    onChange={(event) => setTagsDraft(event.target.value)}
                    className="journal-input"
                    placeholder={copy.tagsPlaceholder}
                  />
                </label>
              </div>

              <label className="journal-field journal-field--manuscript">
                <span>{copy.yourInterpretationNotes}</span>
                <textarea
                  ref={notesRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="journal-manuscript"
                  placeholder={copy.impressionPlaceholder}
                  rows={8}
                />
              </label>

              <div className="journal-oracle-row">
                <button
                  type="button"
                  className="journal-oracle-action"
                  onClick={() => void requestOracleVision()}
                  disabled={isOracleLoading || !linkedReadingId}
                >
                  {isOracleLoading ? copy.oracleVisionLoading : copy.askOracleVision}
                </button>
                <p className="journal-oracle-hint">{copy.journalFeatureText}</p>
                {oracleError ? <p className="journal-oracle-error">{oracleError}</p> : null}
              </div>

              <label className="journal-field">
                <span>{copy.manifestation}</span>
                <textarea
                  value={manifestation}
                  onChange={(event) => setManifestation(event.target.value)}
                  className="journal-input journal-input--area"
                  placeholder={copy.manifestationPlaceholder}
                  rows={3}
                />
              </label>

              <div className="journal-form-actions">
                <button type="submit" className="journal-submit">
                  {editingEntryId ? copy.updateEntry : copy.registerInJournal}
                </button>
              </div>
            </form>

            <Accordion type="single" collapsible className="journal-privacy">
              <AccordionItem value="privacy" className="border-b-0">
                <AccordionTrigger className="journal-privacy-trigger hover:no-underline">
                  <div className="journal-privacy-head">
                    <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{copy.journalPrivacyTitle}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="journal-privacy-body">
                  <p>{copy.journalPrivacyText}</p>
                  <p className="journal-privacy-label">{copy.privacyPolicyTitle}</p>
                  <p>{copy.privacyPolicyText}</p>
                  <p className="journal-privacy-label">{copy.encryptionNoteTitle}</p>
                  <p>{copy.encryptionNoteText}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </aside>

          <section className="journal-list" aria-label={copy.journalNotesTitle}>
            <header className="journal-list-header">
              <div>
                <p className="journal-rail-kicker">{copy.journalNotesTitle}</p>
                <p className="journal-list-count">
                  <span className="journal-count-value">{journal.length}</span> {journalCountLabel}
                </p>
              </div>
              <p className="journal-list-sort">{copy.newestFirst}</p>
            </header>

            <div className="journal-filters">
              <label className="journal-field">
                <span>{copy.filterByTag}</span>
                <input
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  className="journal-input"
                  placeholder={copy.filterByTagPlaceholder}
                />
              </label>
              <div className="journal-field">
                <span>{copy.newsDateLabel}</span>
                <div className="journal-date-row">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="journal-date-trigger">
                        {filterDate
                          ? formatAppDate(filterDate, language)
                          : copy.newsDateLabel}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                      />
                    </PopoverContent>
                  </Popover>
                  {filterDate ? (
                    <button
                      type="button"
                      className="journal-quiet-action"
                      onClick={() => setFilterDate(undefined)}
                    >
                      {copy.cancel}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="journal-stream">
              {visibleJournal.map((entry, index) => {
                const linkedReading = entry.linkedReadingId
                  ? historyById.get(entry.linkedReadingId)
                  : undefined;
                const localizedLinkedReading = linkedReading
                  ? localizeReadingRecord(linkedReading, language)
                  : undefined;
                const mark = String(entryIndexOffset + index + 1).padStart(2, "0");

                return (
                  <motion.article
                    key={entry.id}
                    className="journal-entry"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
                    }
                  >
                    <span className="journal-entry-mark" aria-hidden="true">
                      {mark}
                    </span>
                    <div className="journal-entry-main">
                      <header className="journal-entry-header">
                        <div className="journal-entry-heading">
                          <time
                            className="journal-entry-date"
                            dateTime={entry.createdAt}
                          >
                            {formatAppDate(entry.createdAt, language, "PPp")}
                          </time>
                          <h3 className="journal-entry-title">{entry.title}</h3>
                          {localizedLinkedReading ? (
                            <p className="journal-linked-reading">
                              <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              {copy.linkedTo} {localizedLinkedReading.spreadTitle}
                            </p>
                          ) : null}
                          {(entry.tags ?? []).length > 0 ? (
                            <p className="journal-entry-tags">
                              {(entry.tags ?? []).map((tag) => `#${tag}`).join(" ")}
                            </p>
                          ) : null}
                        </div>
                        <div className="journal-entry-actions">
                          <button
                            type="button"
                            className="journal-entry-action"
                            onClick={() => startEditing(entry.id)}
                          >
                            {copy.editEntry}
                          </button>
                          <button
                            type="button"
                            className="journal-entry-action is-danger"
                            onClick={() => deleteJournalEntry(entry.id)}
                          >
                            {copy.deleteEntry}
                          </button>
                        </div>
                      </header>

                      <div className="journal-entry-body-stack">
                        <div className="journal-entry-section">
                          <p className="journal-section-label">{copy.impression}</p>
                          <p className="journal-entry-body">{entry.content}</p>
                        </div>
                        {entry.manifestation ? (
                          <div className="journal-entry-section is-manifestation">
                            <p className="journal-section-label">{copy.manifestation}</p>
                            <p className="journal-entry-body">{entry.manifestation}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                );
              })}

              {filteredJournal.length === 0 ? (
                <div className="journal-empty">
                  <ZenEmpty
                    className="journal-empty-inner"
                    title={copy.emptyJournalTitle}
                    body={copy.emptyJournalText}
                  />
                  <button type="button" className="journal-submit" onClick={focusCompose}>
                    {copy.registerInJournal}
                  </button>
                </div>
              ) : null}
            </div>

            {filteredJournal.length > JOURNAL_PAGE_SIZE ? (
              <nav className="journal-pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="journal-page-action"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {copy.previousPage}
                </button>
                <p className="journal-page-meta">
                  {currentPage}/{totalPages}
                </p>
                <button
                  type="button"
                  className="journal-page-action"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  {copy.nextPage}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
