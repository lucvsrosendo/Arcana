import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { NewsCommentForm } from "@/components/news/NewsCommentForm";
import { NewsCommentList } from "@/components/news/NewsCommentList";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XP_RULES } from "@/data/xpRules";
import { uiCopy } from "@/data/i18n";
import { formatAppDate } from "@/lib/formatDate";
import { useAuth } from "@/hooks/useAuth";
import { useNewsComments, type NewsCommentSort } from "@/hooks/useNewsComments";
import { useNewsRole } from "@/hooks/useNewsRole";
import { useTarot } from "@/hooks/useTarot";
import { useUserProfile } from "@/hooks/useUserProfile";
import { isSelfInteractionError } from "@/lib/commentInteractionsCloud";
import { getCommentSaveErrorMessage } from "@/lib/newsCommentsCloud";

const sortOptions: NewsCommentSort[] = ["newest", "oldest", "top"];

type NewsCommentsSectionProps = {
  newsId: string;
};

export function NewsCommentsSection({ newsId }: NewsCommentsSectionProps) {
  const language = useTarot((state) => state.language);
  const auth = useAuth();
  const newsRole = useNewsRole();
  const copy = uiCopy[language];
  const { pushToast, pushXpGain } = useToast();
  const { refresh: refreshProfile } = useUserProfile();
  const [commentSort, setCommentSort] = useState<NewsCommentSort>("newest");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);

  const displayName =
    (auth.user?.user_metadata?.display_name as string | undefined)?.trim() ||
    auth.user?.email?.split("@")[0] ||
    copy.anonymousUser;

  const {
    comments,
    isLoading: isCommentsLoading,
    isLoadingMore,
    hasMore,
    commentsFeatureAvailable,
    usingLocalFallback,
    error: commentsError,
    addComment,
    editComment,
    removeComment,
    toggleLike,
    toggleFavorite,
    loadMore,
    canEdit,
    canDelete,
    canInteract,
  } = useNewsComments({
    newsId,
    userId: auth.user?.id,
    displayName,
    isEditor: newsRole.isAdmin || newsRole.isModerator,
    sort: commentSort,
    onXpChange: refreshProfile,
  });

  const formatDate = (value: string) => formatAppDate(value, language, "PPp");

  const sortLabel = (sort: NewsCommentSort) => {
    if (sort === "oldest") {
      return copy.newsCommentsSortOldest;
    }
    if (sort === "top") {
      return copy.newsCommentsSortTop;
    }
    return copy.newsCommentsSortNewest;
  };

  const commentCountBadge = (hasMore
    ? copy.newsCommentsBadgeMore
    : copy.newsCommentsBadge
  ).replace("{count}", String(comments.length));

  const commentXpHint = copy.newsCommentXpHint.replace(
    "{points}",
    String(XP_RULES.commentCreated),
  );

  const handleAddComment = async (body: string) => {
    try {
      if (!usingLocalFallback) {
        const { fetchXpEventPointsWithRetry } = await import("@/lib/tarotCloud");
        const created = await addComment(body, replyTargetId);
        setReplyTargetId(null);
        pushToast(copy.newsCommentCreated, "success");
        const awarded = await fetchXpEventPointsWithRetry("comment_created", created.id);
        if (awarded > 0) {
          pushXpGain(awarded, copy.xpLabel);
        }
        return;
      }

      await addComment(body, replyTargetId);
      setReplyTargetId(null);
      pushToast(copy.newsCommentLocalFallback, "info");
    } catch (error) {
      const reason = getCommentSaveErrorMessage(error);
      const toastByReason: Record<string, string> = {
        "login-required": copy.newsCommentLoginRequired,
        "comment-permission-denied": copy.newsCommentPermissionDenied,
        "comment-foreign-key": copy.newsCommentForeignKeyError,
        "comment-schema-error": copy.newsCommentSchemaError,
      };
      pushToast(toastByReason[reason] ?? copy.newsCommentSaveError, "error");
      throw error;
    }
  };

  const handleEditComment = async (commentId: string, body: string) => {
    try {
      await editComment(commentId, body);
      pushToast(copy.newsCommentUpdated, "success");
    } catch {
      pushToast(copy.newsCommentSaveError, "error");
      throw new Error("save-error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await removeComment(commentId);
      pushToast(copy.newsCommentDeleted, "success");
    } catch {
      pushToast(copy.newsCommentSaveError, "error");
      throw new Error("delete-error");
    }
  };

  const handleToggleLike = async (commentId: string) => {
    try {
      const result = await toggleLike(commentId);
      if (!usingLocalFallback && result.liked) {
        const { fetchXpEventPointsWithRetry } = await import("@/lib/tarotCloud");
        const awarded = await fetchXpEventPointsWithRetry("like_given", commentId);
        if (awarded > 0) {
          pushXpGain(awarded, copy.xpLabel);
        }
      }
    } catch (error) {
      pushToast(
        isSelfInteractionError(error)
          ? copy.commentSelfInteractionBlocked
          : copy.newsCommentSaveError,
        "error",
      );
      throw error;
    }
  };

  const handleToggleFavorite = async (commentId: string) => {
    try {
      const result = await toggleFavorite(commentId);
      if (!usingLocalFallback && result.favorited) {
        const { fetchXpEventPointsWithRetry } = await import("@/lib/tarotCloud");
        const awarded = await fetchXpEventPointsWithRetry("favorite_given", commentId);
        if (awarded > 0) {
          pushXpGain(awarded, copy.xpLabel);
        }
      }
    } catch (error) {
      pushToast(
        isSelfInteractionError(error)
          ? copy.commentSelfInteractionBlocked
          : copy.newsCommentSaveError,
        "error",
      );
      throw error;
    }
  };

  const isLoggedIn = Boolean(auth.session || auth.user);

  const composer = (
    <div className="news-comments-composer">
      <NewsCommentForm
        placeholder={copy.newsCommentPlaceholder}
        submitLabel={copy.newsCommentSubmit}
        emojiButtonLabel={copy.newsEmojiPicker}
        emojiSearchPlaceholder={copy.newsEmojiSearch}
        emojiLoadingLabel={copy.newsEmojiLoading}
        emojiEmptyLabel={copy.newsEmojiEmpty}
        hintLabel={commentXpHint}
        hintTooltip={copy.xpRuleComment.replace(
          "{points}",
          String(XP_RULES.commentCreated),
        )}
        profanityError={copy.commentProfanityBlocked}
        disabled={false}
        loginCta={
          isLoggedIn ? undefined : (
            <p className="text-sm text-muted-foreground">{copy.newsCommentLoginRequired}</p>
          )
        }
        replyHint={replyTargetId ? copy.newsCommentReplying : undefined}
        onCancelReply={() => setReplyTargetId(null)}
        cancelReplyLabel={copy.newsCommentCancel}
        onSubmit={handleAddComment}
      />
    </div>
  );

  return (
    <section className="news-comments-section" aria-labelledby="news-comments-title">
      <header className="news-comments-header">
        <h2 id="news-comments-title" className="font-display text-architectural text-2xl font-light">
          {copy.newsCommentsTitle}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {commentsFeatureAvailable !== false ? (
            <span className="text-minimal text-muted-foreground">{commentCountBadge}</span>
          ) : null}
          {commentsFeatureAvailable !== false ? (
            <Select
              value={commentSort}
              onValueChange={(value) => setCommentSort(value as NewsCommentSort)}
            >
              <SelectTrigger className="h-8 w-[160px]" aria-label={copy.newsCommentsSortLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {sortLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </header>

      {composer}

      {usingLocalFallback ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {copy.newsCommentLocalFallback}
        </p>
      ) : null}

      {commentsFeatureAvailable === false ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {copy.newsCommentSchemaError}
        </p>
      ) : isCommentsLoading || commentsFeatureAvailable === null ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>{copy.loadingShort}</span>
        </div>
      ) : commentsError ? (
        <p className="mt-4 text-sm text-destructive">{copy.newsCommentLoadError}</p>
      ) : (
        <div className="mt-6">
          <NewsCommentList
            comments={comments}
            emptyLabel={copy.newsCommentsEmpty}
            isLoggedIn={isLoggedIn}
            canEdit={canEdit}
            canDelete={canDelete}
            canInteract={canInteract}
            editLabel={copy.newsCommentEdit}
            deleteLabel={copy.newsCommentDelete}
            saveLabel={copy.newsCommentSave}
            cancelLabel={copy.newsCommentCancel}
            deleteConfirmLabel={copy.newsCommentDeleteConfirm}
            likeLabel={copy.commentLike}
            unlikeLabel={copy.commentUnlike}
            favoriteLabel={copy.commentFavorite}
            unfavoriteLabel={copy.commentUnfavorite}
            loginRequiredLabel={copy.newsCommentLoginRequired}
            selfInteractionLabel={copy.commentSelfInteractionBlocked}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            onToggleLike={handleToggleLike}
            onToggleFavorite={handleToggleFavorite}
            formatDate={formatDate}
            replyLabel={copy.newsCommentReply}
            onReply={setReplyTargetId}
          />
          {hasMore ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
              >
                {isLoadingMore ? copy.loadingShort : copy.newsCommentsLoadMore}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
