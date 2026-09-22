import { memo, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkifyCardNames } from "../../lib/chatCardRefs";
import type { CardReference } from "../../lib/chatCardRefs";
import type { ChatMessage } from "../../hooks/useTarotChat";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  copyLabel: string;
  copiedLabel: string;
  cardReferences?: readonly CardReference[];
  onCardReferenceClick?: (slotId: string) => void;
  isStreaming?: boolean;
};

const isSafeHref = (href: string | undefined) => {
  if (!href) {
    return false;
  }
  if (href.startsWith("card:")) {
    return true;
  }
  try {
    const url = new URL(href, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const createMarkdownComponents = (
  onCardReferenceClick?: (slotId: string) => void,
): Components => ({
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    if (!isSafeHref(href)) {
      return <span>{children}</span>;
    }

    if (href?.startsWith("card:")) {
      const slotId = href.slice(5);
      return (
        <Button
          type="button"
          variant="link"
          className="chat-card-ref h-auto p-0"
          onClick={() => onCardReferenceClick?.(slotId)}
        >
          {children}
        </Button>
      );
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
});

const rehypePlugins = [rehypeSanitize];

export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  copyLabel,
  copiedLabel,
  cardReferences = [],
  onCardReferenceClick,
  isStreaming = false,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const markdownContent =
    !isUser && cardReferences.length > 0
      ? linkifyCardNames(message.content, cardReferences)
      : message.content;

  const markdownComponents = useMemo(
    () => createMarkdownComponents(onCardReferenceClick),
    [onCardReferenceClick],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard errors.
    }
  };

  return (
    <div className={`chat-row${isUser ? " user" : ""} chat-row-animate`}>
      <div className="chat-bubble-wrap">
        <div className={isUser ? "chat-bubble user" : "chat-bubble assistant"}>
          {isUser ? (
            message.content
          ) : isStreaming ? (
            <span className="chat-bubble-streaming">{message.content}</span>
          ) : (
            <ReactMarkdown rehypePlugins={rehypePlugins} components={markdownComponents}>
              {markdownContent}
            </ReactMarkdown>
          )}
        </div>
        {!isUser && message.content && !isStreaming ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="chat-copy-button"
            onClick={() => void handleCopy()}
            aria-label={copyLabel}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copied ? copiedLabel : copyLabel}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
});
