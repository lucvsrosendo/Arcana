import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildTarotChatContext } from "../lib/chatContext";
import { buildDynamicSuggestions } from "../lib/chatSuggestions";
import { getCardReferences } from "../lib/chatCardRefs";
import { useTarotChat } from "../hooks/useTarotChat";
import { useToast } from "./ToastProvider";
import { ChatSuggestions } from "./chat/ChatSuggestions";
import { ChatMessageBubble } from "./chat/ChatMessageBubble";
import { ChatLoadingBubble } from "./chat/ChatLoadingBubble";
import { ChatErrorBanner } from "./chat/ChatErrorBanner";
import { ChatInputBar } from "./chat/ChatInputBar";
import type { LanguageCode, ReadingSlot, SpreadDefinition } from "../types/tarot";

type TarotChatProps = {
  language: LanguageCode;
  copy: Record<string, string>;
  spread: SpreadDefinition;
  reading: ReadingSlot[];
  revealedSlotIds: string[];
  focusedSlotId?: string | null;
  learningMode?: boolean;
  question?: string;
  onCardReferenceClick?: (slotId: string) => void;
};

export function TarotChat({
  language,
  copy,
  spread,
  reading,
  revealedSlotIds,
  focusedSlotId,
  learningMode = false,
  question,
  onCardReferenceClick,
}: TarotChatProps) {
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const { pushToast } = useToast();

  const context = useMemo(
    () =>
      buildTarotChatContext(
        language,
        spread,
        reading,
        revealedSlotIds,
        focusedSlotId,
        question,
        learningMode,
      ),
    [focusedSlotId, language, learningMode, question, reading, revealedSlotIds, spread],
  );

  const handleQuestionChanged = useCallback(() => {
    pushToast(copy.chatQuestionChanged, "info");
  }, [copy.chatQuestionChanged, pushToast]);

  const {
    messages,
    isLoading,
    error,
    deepMode,
    setDeepMode,
    sendMessage,
    retryLastMessage,
    clearMessages,
  } = useTarotChat(context, copy.chatError, handleQuestionChanged);

  const displayedError =
    error && error.toLowerCase().includes("groq") ? copy.chatConfigMissing : error;
  const suggestions = useMemo(
    () => buildDynamicSuggestions(context, reading, revealedSlotIds, copy),
    [context, copy, reading, revealedSlotIds],
  );
  const cardReferences = useMemo(() => getCardReferences(reading), [reading]);

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      setDraft(suggestion);
      focusInput();
    },
    [focusInput],
  );

  useEffect(() => {
    const grew = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (!grew && !isLoading) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, isLoading, error]);

  useEffect(() => {
    if (focusedSlotId) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusedSlotId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft, { deepMode });
    setDraft("");
  };

  const handleClear = () => {
    clearMessages();
    setDraft("");
  };

  const isReadingComplete = context.cards.length === reading.length;
  const focusedCardQuestion = context.focusedCard
    ? `${copy.askAboutCard}: ${context.focusedCard.cardName} (${context.focusedCard.position})`
    : undefined;

  return (
    <section ref={panelRef} className="chat-panel">
      <header className="chat-header">
        <div className="chat-header-copy">
          <p className="chat-kicker" aria-hidden="true">
            XVIII
          </p>
          <h2 className="chat-title font-display text-architectural">{copy.chatTitle}</h2>
          <p className="chat-subtitle">{copy.chatSubtitle}</p>
          <p className="chat-notice">{copy.chatInterpretiveNotice}</p>
          {learningMode ? (
            <p className="chat-learning-hint">
              {copy.learningMode}: {copy.chatSuggestionAdvice}
            </p>
          ) : null}
        </div>
        <p className="chat-status" title={copy.activeReading}>
          <span className="chat-status-count">
            {context.cards.length}
            <span aria-hidden="true">/</span>
            {reading.length}
          </span>
          <span className="chat-status-label">{copy.activeReading}</span>
        </p>
      </header>

      <div className="chat-layout">
        <ChatSuggestions
          copy={copy}
          spreadTitle={spread.title}
          context={context}
          suggestions={suggestions}
          isReadingComplete={isReadingComplete}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
          onSelectSuggestion={handleSelectSuggestion}
          onSendFocusedCard={() => void sendMessage(focusedCardQuestion ?? "", { deepMode })}
          onSendSummary={() => void sendMessage(copy.chatSuggestionSummary, { deepMode })}
          focusedCardQuestion={focusedCardQuestion}
        />

        <div className="chat-conversation">
          <div className="chat-messages" aria-live="polite" aria-busy={isLoading}>
            {messages.length === 0 ? (
              <div className="chat-empty">
                <span className="chat-empty-mark" aria-hidden="true" />
                <p>{copy.chatEmpty}</p>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                copyLabel={copy.chatCopy}
                copiedLabel={copy.chatCopied}
                cardReferences={cardReferences}
                onCardReferenceClick={onCardReferenceClick}
                isStreaming={
                  isLoading &&
                  index === messages.length - 1 &&
                  message.role === "assistant"
                }
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" ? (
              <ChatLoadingBubble label={copy.chatTyping} />
            ) : null}
            {displayedError ? (
              <ChatErrorBanner
                error={displayedError}
                retryLabel={copy.chatRetry}
                onRetry={() => void retryLastMessage()}
                disabled={isLoading}
              />
            ) : null}
            <div ref={messagesEndRef} className="chat-messages-anchor" />
          </div>

          <ChatInputBar
            ref={inputRef}
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            onClear={handleClear}
            placeholder={copy.chatPlaceholder}
            sendLabel={copy.chatSend}
            clearLabel={copy.clear}
            briefLabel={copy.chatBriefMode}
            deepLabel={copy.chatDeepMode}
            deepActive={deepMode}
            onToggleDeep={() => setDeepMode((value) => !value)}
            disabled={isLoading}
            canClear={messages.length > 0}
          />
        </div>
      </div>
    </section>
  );
}
