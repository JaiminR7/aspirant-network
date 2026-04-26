import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MessageSquare, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { circlePostService } from "../services/circleService";
import { formatRelativeTime } from "../utils/dateUtils";


const CirclePostCard = ({ post, currentUserId, onDelete }) => {
  const [localPost, setLocalPost] = useState(post);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);

  const isOwner = localPost.author?._id === currentUserId;

  const comments = useMemo(
    () => localPost.comments || [],
    [localPost.comments],
  );

  const updateVoteState = (type) => {
    const current = localPost.userVoteStatus || "none";
    let likes = localPost.likesCount || 0;
    let dislikes = localPost.dislikesCount || 0;
    let nextStatus = current;

    if (type === "upvote") {
      if (current === "upvoted") {
        likes -= 1;
        nextStatus = "none";
      } else if (current === "downvoted") {
        dislikes -= 1;
        likes += 1;
        nextStatus = "upvoted";
      } else {
        likes += 1;
        nextStatus = "upvoted";
      }
    } else {
      if (current === "downvoted") {
        dislikes -= 1;
        nextStatus = "none";
      } else if (current === "upvoted") {
        likes -= 1;
        dislikes += 1;
        nextStatus = "downvoted";
      } else {
        dislikes += 1;
        nextStatus = "downvoted";
      }
    }

    return {
      likesCount: Math.max(0, likes),
      dislikesCount: Math.max(0, dislikes),
      userVoteStatus: nextStatus,
    };
  };

  const handleVote = async (type) => {
    if (voteBusy) return;
    setVoteBusy(true);

    const previous = {
      likesCount: localPost.likesCount,
      dislikesCount: localPost.dislikesCount,
      userVoteStatus: localPost.userVoteStatus,
    };

    setLocalPost((prev) => ({ ...prev, ...updateVoteState(type) }));

    try {
      const data =
        type === "upvote"
          ? await circlePostService.upvote(localPost._id)
          : await circlePostService.downvote(localPost._id);

      setLocalPost((prev) => ({
        ...prev,
        likesCount: data.data.likesCount,
        dislikesCount: data.data.dislikesCount,
        commentsCount: data.data.commentsCount,
        userVoteStatus: data.data.userVoteStatus,
      }));
    } catch (error) {
      setLocalPost((prev) => ({ ...prev, ...previous }));
    } finally {
      setVoteBusy(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isCommenting) return;

    const optimisticComment = {
      _id: `tmp-${Date.now()}`,
      content: commentText.trim(),
      commentedBy: { _id: currentUserId, name: "You", username: "you" },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    const previousComments = comments;
    const previousCount = localPost.commentsCount || comments.length;

    setIsCommenting(true);
    setCommentText("");
    setLocalPost((prev) => ({
      ...prev,
      comments: [optimisticComment, ...(prev.comments || [])],
      commentsCount: previousCount + 1,
    }));

    try {
      const data = await circlePostService.addComment(
        localPost._id,
        optimisticComment.content,
      );
      setLocalPost((prev) => ({
        ...prev,
        comments: data.data.comments || [],
        commentsCount:
          data.data.commentsCount || (data.data.comments || []).length,
      }));
    } catch (error) {
      setLocalPost((prev) => ({
        ...prev,
        comments: previousComments,
        commentsCount: previousCount,
      }));
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || isDeleting) return;
    setIsDeleting(true);
    try {
      await circlePostService.delete(localPost._id);
      onDelete?.(localPost._id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  return (
    <article className="content-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="avatar h-10 w-10 text-sm">
            {localPost.author?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              {localPost.author?.name || "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">
              @{localPost.author?.username || "unknown"} ·{" "}
              {formatRelativeTime(localPost.createdAt)}
            </p>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {localPost.type && (
        <div className="mb-3">
          <Badge variant="outline" className="capitalize">
            {localPost.type}
          </Badge>
        </div>
      )}

      <p className="text-foreground whitespace-pre-wrap mb-4">
        {localPost.content}
      </p>

      <div className="flex items-center gap-5 text-sm mb-4">
        <button
          onClick={() => handleVote("upvote")}
          className={`inline-flex items-center gap-2 ${localPost.userVoteStatus === "upvoted" ? "text-sky-700" : "text-muted-foreground"}`}
        >
          <span
            className={`inline-flex items-center justify-center rounded-full border p-1.5 ${
              localPost.userVoteStatus === "upvoted"
                ? "border-sky-300 bg-sky-100 text-sky-700"
                : "border-sky-200 bg-sky-50 text-sky-600"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </span>
          <span>{localPost.likesCount || 0}</span>
        </button>

        <button
          onClick={() => handleVote("downvote")}
          className={`inline-flex items-center gap-2 ${localPost.userVoteStatus === "downvoted" ? "text-red-700" : "text-muted-foreground"}`}
        >
          <span
            className={`inline-flex items-center justify-center rounded-full border p-1.5 ${
              localPost.userVoteStatus === "downvoted"
                ? "border-red-300 bg-red-100 text-red-700"
                : "border-red-200 bg-red-50 text-red-500"
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </span>
          <span>{localPost.dislikesCount || 0}</span>
        </button>

        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 p-1.5">
            <MessageSquare className="w-4 h-4" />
          </span>
          <span>{localPost.commentsCount || comments.length || 0}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment"
            rows={2}
            className="text-sm"
          />
          <Button
            onClick={handleAddComment}
            disabled={!commentText.trim() || isCommenting}
          >
            Post
          </Button>
        </div>

        {comments.length > 0 && (
          <div className="space-y-2 pt-1">
            {comments.slice(0, 3).map((comment) => (
              <div
                key={comment._id}
                className="rounded-lg bg-muted/40 px-3 py-2"
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {comment.commentedBy?.name ||
                    comment.commentedBy?.username ||
                    "User"}{" "}
                  · {formatRelativeTime(comment.createdAt)}
                </p>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            ))}
            {comments.length > 3 && (
              <Badge variant="outline" className="rounded-full text-xs">
                +{comments.length - 3} more comments
              </Badge>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default CirclePostCard;
