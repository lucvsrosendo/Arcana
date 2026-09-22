type ChatLoadingBubbleProps = {
  label: string;
};

export function ChatLoadingBubble({ label }: ChatLoadingBubbleProps) {
  return (
    <div className="chat-row chat-row-animate">
      <div className="chat-bubble-wrap">
        <div className="chat-bubble assistant chat-bubble-loading">
          <span className="chat-typing-label">{label}</span>
        </div>
      </div>
    </div>
  );
}
