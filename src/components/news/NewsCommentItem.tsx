import Linkify from "linkify-react";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { Bookmark, Heart, Pencil, Trash2, UserRound } from "lucide-react";
import type { NewsComment } from "@/data/siteNews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type NewsCommentItemProps = {
  comment: NewsComment;
  canEdit: boolean;
  canDelete: boolean;
  canInteract: boolean;
  isLoggedIn: boolean;
  editLabel: string;
  deleteLabel: string;
  saveLabel: string;
  cancelLabel: string;
  deleteConfirmLabel: string;
  deleteConfirmDescription?: string;
  likeLabel: string;
  unlikeLabel: string;
  favoriteLabel: string;
  unfavoriteLabel: string;
  loginRequiredLabel: string;
  selfInteractionLabel: string;
  onEdit: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onToggleLike: (commentId: string) => Promise<void>;
  onToggleFavorite: (commentId: string) => Promise<void>;
  formatDate: (value: string) => string;
  replyLabel?: string;
  onReply?: (commentId: string) => void;
};

const linkifyOptions = {
  target: "_blank",
  rel: "noopener noreferrer",
  className: "text-primary underline underline-offset-2",
};

export function NewsCommentItem({
  comment,
  canEdit,
  canDelete,
  canInteract,
  isLoggedIn,
  editLabel,
  deleteLabel,
  saveLabel,
  cancelLabel,
  deleteConfirmLabel,
  deleteConfirmDescription,
  likeLabel,
  unlikeLabel,
  favoriteLabel,
  unfavoriteLabel,
  loginRequiredLabel,
  selfInteractionLabel,
  onEdit,
  onDelete,
  onToggleLike,
  onToggleFavorite,
  formatDate,
  replyLabel,
  onReply,
}: NewsCommentItemProps) {
  const { pushToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(comment.id, draft);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!isLoggedIn) {
      pushToast(loginRequiredLabel, "info");
      return;
    }

    if (!canInteract) {
      pushToast(selfInteractionLabel, "info");
      return;
    }

    if (isTogglingLike) {
      return;
    }

    setIsTogglingLike(true);
    try {
      await onToggleLike(comment.id);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      pushToast(loginRequiredLabel, "info");
      return;
    }

    if (!canInteract) {
      pushToast(selfInteractionLabel, "info");
      return;
    }

    if (isTogglingFavorite) {
      return;
    }

    setIsTogglingFavorite(true);
    try {
      await onToggleFavorite(comment.id);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const displayName = comment.authorDisplayName.trim() || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <article className="news-comment-item">
      <div className="news-comment-avatar" aria-hidden="true">
        {comment.authorAvatarUrl ? (
          <img
            src={comment.authorAvatarUrl}
            alt=""
            className="news-comment-avatar-img"
            width={36}
            height={36}
            loading="lazy"
            decoding="async"
          />
        ) : initial ? (
          initial
        ) : (
          <UserRound className="h-4 w-4" />
        )}
      </div>
      <div className="news-comment-body-wrap">
        <div className="news-comment-meta">
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <button type="button" className="font-semibold hover:underline">
                {displayName}
              </button>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-56">
              <div className="flex items-center gap-3">
                <div className="news-comment-avatar shrink-0" aria-hidden="true">
                  {comment.authorAvatarUrl ? (
                    <img
                      src={comment.authorAvatarUrl}
                      alt=""
                      className="news-comment-avatar-img"
                      width={36}
                      height={36}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
          {comment.updatedAt !== comment.createdAt ? (
            <span className="news-comment-edited">*</span>
          ) : null}
        </div>

        {isEditing ? (
          <form className="news-comment-edit-form" onSubmit={(event) => void handleSave(event)}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="news-comment-input"
              rows={3}
              disabled={isSaving}
            />
            <div className="news-comment-item-actions">
              <Button type="submit" size="sm" disabled={isSaving || !draft.trim()}>
                {saveLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(comment.body);
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                {cancelLabel}
              </Button>
            </div>
          </form>
        ) : (
          <p className="news-comment-text">
            <Linkify options={linkifyOptions}>{comment.body}</Linkify>
          </p>
        )}

        {!isEditing ? (
          <div className="news-comment-interactions">
            <button
              type="button"
              className={
                comment.likedByCurrentUser
                  ? "comment-like-btn is-active"
                  : "comment-like-btn"
              }
              onClick={() => void handleToggleLike()}
              disabled={isTogglingLike || (!canInteract && isLoggedIn)}
              aria-pressed={comment.likedByCurrentUser}
              aria-label={comment.likedByCurrentUser ? unlikeLabel : likeLabel}
            >
              <Heart className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{comment.likeCount}</span>
            </button>
            <button
              type="button"
              className={
                comment.favoritedByCurrentUser
                  ? "comment-favorite-btn is-active"
                  : "comment-favorite-btn"
              }
              onClick={() => void handleToggleFavorite()}
              disabled={isTogglingFavorite || (!canInteract && isLoggedIn)}
              aria-pressed={comment.favoritedByCurrentUser}
              aria-label={
                comment.favoritedByCurrentUser ? unfavoriteLabel : favoriteLabel
              }
            >
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{comment.favoriteCount}</span>
            </button>
            {onReply && replyLabel && isLoggedIn ? (
              <button
                type="button"
                className="comment-reply-btn"
                onClick={() => onReply(comment.id)}
              >
                {replyLabel}
              </button>
            ) : null}
          </div>
        ) : null}

        {!isEditing && (canEdit || canDelete) ? (
          <div className="news-comment-item-actions">
            {canEdit ? (
              <button
                type="button"
                className="news-comment-action"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {editLabel}
              </button>
            ) : null}
            {canDelete ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" className="news-comment-action danger" disabled={isDeleting}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {deleteLabel}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{deleteConfirmLabel}</AlertDialogTitle>
                    {deleteConfirmDescription ? (
                      <AlertDialogDescription>{deleteConfirmDescription}</AlertDialogDescription>
                    ) : null}
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleDelete()}>
                      {deleteLabel}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
