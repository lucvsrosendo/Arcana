import { useEffect, useRef } from "react";
import { EmojiPicker } from "frimousse";
import { Smile } from "lucide-react";

type EmojiPickerPopoverProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  searchPlaceholder: string;
  loadingLabel: string;
  emptyLabel: string;
  buttonLabel: string;
  disabled?: boolean;
};

export function EmojiPickerPopover({
  isOpen,
  onToggle,
  onClose,
  onEmojiSelect,
  searchPlaceholder,
  loadingLabel,
  emptyLabel,
  buttonLabel,
  disabled = false,
}: EmojiPickerPopoverProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="emoji-picker-anchor" ref={rootRef}>
      <button
        type="button"
        className="emoji-picker-trigger"
        onClick={onToggle}
        aria-label={buttonLabel}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <Smile className="h-4 w-4" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="emoji-picker-popover" role="dialog" aria-label={buttonLabel}>
          <EmojiPicker.Root
            className="emoji-picker-root"
            locale="pt"
            columns={8}
            onEmojiSelect={(emoji) => {
              onEmojiSelect(emoji.emoji);
              onClose();
            }}
          >
            <EmojiPicker.Search
              className="emoji-picker-search"
              placeholder={searchPlaceholder}
            />
            <EmojiPicker.Viewport className="emoji-picker-viewport">
              <EmojiPicker.Loading className="emoji-picker-status">{loadingLabel}</EmojiPicker.Loading>
              <EmojiPicker.Empty className="emoji-picker-status">{emptyLabel}</EmojiPicker.Empty>
              <EmojiPicker.List
                className="emoji-picker-list"
                components={{
                  CategoryHeader: ({ category, ...props }) => (
                    <div className="emoji-picker-category" {...props}>
                      {category.label}
                    </div>
                  ),
                  Row: ({ children, ...props }) => (
                    <div className="emoji-picker-row" {...props}>
                      {children}
                    </div>
                  ),
                  Emoji: ({ emoji, ...props }) => (
                    <button type="button" className="emoji-picker-emoji" {...props}>
                      {emoji.emoji}
                    </button>
                  ),
                }}
              />
            </EmojiPicker.Viewport>
          </EmojiPicker.Root>
        </div>
      ) : null}
    </div>
  );
}
