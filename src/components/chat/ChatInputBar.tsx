import { FormEvent, forwardRef } from "react";
import { Send, Trash2 } from "lucide-react";

type ChatInputBarProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  placeholder: string;
  sendLabel: string;
  clearLabel: string;
  briefLabel: string;
  deepLabel: string;
  deepActive: boolean;
  onToggleDeep: () => void;
  disabled: boolean;
  canClear: boolean;
};

export const ChatInputBar = forwardRef<HTMLTextAreaElement, ChatInputBarProps>(
  function ChatInputBar(
    {
      draft,
      onDraftChange,
      onSubmit,
      onClear,
      placeholder,
      sendLabel,
      clearLabel,
      briefLabel,
      deepLabel,
      deepActive,
      onToggleDeep,
      disabled,
      canClear,
    },
    ref,
  ) {
    return (
      <form className="chat-form" onSubmit={onSubmit}>
        <label className="chat-input-shell">
          <span className="sr-only">{placeholder}</span>
          <textarea
            ref={ref}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="chat-input"
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </label>
        <div className="chat-form-actions">
          <div className="chat-depth-switch" role="group" aria-label={deepLabel}>
            <button
              type="button"
              className={`chat-depth-option${!deepActive ? " is-active" : ""}`}
              onClick={() => {
                if (deepActive) {
                  onToggleDeep();
                }
              }}
              disabled={disabled}
              aria-pressed={!deepActive}
            >
              {briefLabel}
            </button>
            <span className="chat-depth-sep" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              className={`chat-depth-option${deepActive ? " is-active" : ""}`}
              onClick={() => {
                if (!deepActive) {
                  onToggleDeep();
                }
              }}
              disabled={disabled}
              aria-pressed={deepActive}
            >
              {deepLabel}
            </button>
          </div>

          <div className="chat-form-cta">
            <button
              type="submit"
              className="chat-send-button"
              disabled={disabled || !draft.trim()}
            >
              <Send className="chat-cta-icon" aria-hidden="true" />
              {sendLabel}
            </button>
            <button
              type="button"
              className="chat-clear-button"
              onClick={onClear}
              disabled={disabled || !canClear}
            >
              <Trash2 className="chat-cta-icon" aria-hidden="true" />
              {clearLabel}
            </button>
          </div>
        </div>
      </form>
    );
  },
);
