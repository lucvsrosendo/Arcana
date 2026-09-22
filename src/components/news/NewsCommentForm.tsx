import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { MAX_COMMENT_LENGTH } from "@/lib/newsCommentsCloud";
import { containsProfanity } from "@/lib/profanityFilter";
import { EmojiPickerPopover } from "./EmojiPickerPopover";

const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "required")
    .max(MAX_COMMENT_LENGTH, "max-length"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

type NewsCommentFormProps = {
  placeholder: string;
  submitLabel: string;
  emojiButtonLabel: string;
  emojiSearchPlaceholder: string;
  emojiLoadingLabel: string;
  emojiEmptyLabel: string;
  hintLabel?: string;
  hintTooltip?: string;
  profanityError?: string;
  disabled?: boolean;
  loginCta?: ReactNode;
  replyHint?: string;
  onCancelReply?: () => void;
  cancelReplyLabel?: string;
  onSubmit: (body: string) => Promise<void>;
};

export function NewsCommentForm({
  placeholder,
  submitLabel,
  emojiButtonLabel,
  emojiSearchPlaceholder,
  emojiLoadingLabel,
  emojiEmptyLabel,
  hintLabel,
  hintTooltip,
  profanityError,
  disabled = false,
  loginCta,
  replyHint,
  onCancelReply,
  cancelReplyLabel,
  onSubmit,
}: NewsCommentFormProps) {
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  });

  const isSubmitting = form.formState.isSubmitting;
  const bodyValue = form.watch("body");

  const insertEmoji = (emoji: string) => {
    const current = form.getValues("body");
    form.setValue("body", `${current}${emoji}`, { shouldValidate: true });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    if (containsProfanity(values.body)) {
      form.setError("body", { message: profanityError ?? "profanity" });
      return;
    }

    try {
      await onSubmit(values.body);
      form.reset();
    } catch {
      // Keep draft text so the user can retry after a save error.
    }
  });

  return (
    <Form {...form}>
      <form className="news-comment-form" onSubmit={(event) => void handleSubmit(event)}>
        {loginCta ? <div className="news-comment-form-login">{loginCta}</div> : null}

        {replyHint ? (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{replyHint}</span>
            {onCancelReply && cancelReplyLabel ? (
              <Button type="button" variant="ghost" size="sm" onClick={onCancelReply}>
                {cancelReplyLabel}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="news-comment-form-row">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={placeholder}
                    disabled={disabled || isSubmitting}
                    rows={4}
                    maxLength={MAX_COMMENT_LENGTH}
                    className="news-comment-input min-h-[6.5rem]"
                    aria-label={placeholder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="news-comment-form-actions">
            <EmojiPickerPopover
              isOpen={isEmojiOpen}
              onToggle={() => setIsEmojiOpen((value) => !value)}
              onClose={() => setIsEmojiOpen(false)}
              onEmojiSelect={insertEmoji}
              buttonLabel={emojiButtonLabel}
              searchPlaceholder={emojiSearchPlaceholder}
              loadingLabel={emojiLoadingLabel}
              emptyLabel={emojiEmptyLabel}
              disabled={disabled || isSubmitting}
            />
            <Button
              type="submit"
              disabled={disabled || isSubmitting || !bodyValue.trim()}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitLabel}
            </Button>
          </div>
        </div>

        {hintLabel ? (
          hintTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="news-comment-form-hint cursor-help">{hintLabel}</p>
              </TooltipTrigger>
              <TooltipContent>{hintTooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <p className="news-comment-form-hint">{hintLabel}</p>
          )
        ) : null}
      </form>
    </Form>
  );
}
