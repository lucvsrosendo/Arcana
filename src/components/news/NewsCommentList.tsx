import type { NewsComment } from "../../data/siteNews";
import { NewsCommentItem } from "./NewsCommentItem";

type NewsCommentListProps = {
  comments: NewsComment[];
  emptyLabel: string;
  isLoggedIn: boolean;
  canEdit: (comment: NewsComment) => boolean;
  canDelete: (comment: NewsComment) => boolean;
  canInteract: (comment: NewsComment) => boolean;
  editLabel: string;
  deleteLabel: string;
  saveLabel: string;
  cancelLabel: string;
  deleteConfirmLabel: string;
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

export function NewsCommentList({
  comments,
  emptyLabel,
  isLoggedIn,
  canEdit,
  canDelete,
  canInteract,
  editLabel,
  deleteLabel,
  saveLabel,
  cancelLabel,
  deleteConfirmLabel,
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
}: NewsCommentListProps) {
  if (comments.length === 0) {
    return <p className="news-comments-empty">{emptyLabel}</p>;
  }

  const rootComments = comments.filter((comment) => !comment.parentId);
  const repliesByParent = comments.reduce<Record<string, NewsComment[]>>((acc, comment) => {
    if (!comment.parentId) {
      return acc;
    }
    acc[comment.parentId] = [...(acc[comment.parentId] ?? []), comment];
    return acc;
  }, {});

  const renderComment = (comment: NewsComment, nested = false) => (
    <div key={comment.id} className={nested ? "news-comment-reply ml-6 mt-3 border-l border-border pl-4" : ""}>
      <NewsCommentItem
        comment={comment}
        isLoggedIn={isLoggedIn}
        canEdit={canEdit(comment)}
        canDelete={canDelete(comment)}
        canInteract={canInteract(comment)}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
        saveLabel={saveLabel}
        cancelLabel={cancelLabel}
        deleteConfirmLabel={deleteConfirmLabel}
        likeLabel={likeLabel}
        unlikeLabel={unlikeLabel}
        favoriteLabel={favoriteLabel}
        unfavoriteLabel={unfavoriteLabel}
        loginRequiredLabel={loginRequiredLabel}
        selfInteractionLabel={selfInteractionLabel}
        replyLabel={replyLabel}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleLike={onToggleLike}
        onToggleFavorite={onToggleFavorite}
        formatDate={formatDate}
      />
      {(repliesByParent[comment.id] ?? []).map((reply) => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="news-comment-list">
      {rootComments.map((comment) => renderComment(comment))}
    </div>
  );
}
