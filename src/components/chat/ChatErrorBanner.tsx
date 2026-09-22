import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatErrorBannerProps = {
  error: string;
  retryLabel: string;
  onRetry: () => void;
  disabled?: boolean;
};

export function ChatErrorBanner({
  error,
  retryLabel,
  onRetry,
  disabled = false,
}: ChatErrorBannerProps) {
  return (
    <div className="chat-error-banner" role="alert">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{error}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="chat-retry-button"
        onClick={onRetry}
        disabled={disabled}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        {retryLabel}
      </Button>
    </div>
  );
}
