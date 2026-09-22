import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TarotChatContext } from "../../lib/chatContext";

const MOBILE_SUGGESTIONS_QUERY = "(max-width: 767px)";

type ChatSuggestionsProps = {
  copy: Record<string, string>;
  spreadTitle: string;
  context: TarotChatContext;
  suggestions: string[];
  isReadingComplete: boolean;
  isLoading: boolean;
  hasMessages: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  onSendFocusedCard: () => void;
  onSendSummary: () => void;
  focusedCardQuestion?: string;
};

const isDesktopViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 768px)").matches;

export function ChatSuggestions({
  copy,
  spreadTitle,
  context,
  suggestions,
  isReadingComplete,
  isLoading,
  hasMessages,
  onSelectSuggestion,
  onSendFocusedCard,
  onSendSummary,
  focusedCardQuestion,
}: ChatSuggestionsProps) {
  const userToggledRef = useRef(false);
  const [isOpen, setIsOpen] = useState(() =>
    typeof window !== "undefined" ? isDesktopViewport() : true,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_SUGGESTIONS_QUERY);
    const syncForViewport = () => {
      if (userToggledRef.current) {
        return;
      }
      setIsOpen(!mediaQuery.matches);
    };

    syncForViewport();
    mediaQuery.addEventListener("change", syncForViewport);
    return () => mediaQuery.removeEventListener("change", syncForViewport);
  }, []);

  useEffect(() => {
    if (hasMessages && !isDesktopViewport()) {
      setIsOpen(false);
    }
  }, [hasMessages]);

  const collapsePanel = () => {
    if (window.matchMedia(MOBILE_SUGGESTIONS_QUERY).matches) {
      setIsOpen(false);
      userToggledRef.current = true;
    }
  };

  const handleToggle = () => {
    setIsOpen((value) => !value);
    userToggledRef.current = true;
  };

  return (
    <aside className={`chat-suggestions-panel${isOpen ? " is-open" : ""}`}>
      <button
        type="button"
        className="chat-suggestions-toggle"
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <span>{copy.chatSuggestionsTitle}</span>
        <ChevronDown className="chat-suggestions-chevron" aria-hidden="true" />
      </button>

      <div className="chat-suggestions-body">
        <div className="chat-reading-meta">
          <p className="chat-reading-kicker">{copy.activeReading}</p>
          <h3 className="chat-reading-title font-display">{spreadTitle}</h3>
        </div>

        {context.focusedCard && focusedCardQuestion ? (
          <button
            type="button"
            onClick={() => {
              onSendFocusedCard();
              collapsePanel();
            }}
            disabled={isLoading}
            className="chat-focus-card"
          >
            <span className="chat-focus-label">{copy.chatFocusCard}</span>
            <span className="chat-focus-name">
              {String(context.focusedCard.number).padStart(2, "0")} ·{" "}
              {context.focusedCard.cardName}
            </span>
          </button>
        ) : null}

        {isReadingComplete ? (
          <button
            type="button"
            onClick={() => {
              onSendSummary();
              collapsePanel();
            }}
            disabled={isLoading}
            className="chat-summary-button"
          >
            {copy.summarizeReading}
          </button>
        ) : null}

        <ul className="chat-suggestions-grid">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => {
                  onSelectSuggestion(suggestion);
                  collapsePanel();
                }}
                disabled={isLoading}
                className="chat-suggestion"
                title={copy.chatSuggestionFill}
              >
                <span className="chat-suggestion-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="chat-suggestion-text">{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
