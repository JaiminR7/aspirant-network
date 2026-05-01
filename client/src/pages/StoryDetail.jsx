import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import PostTypeBadge from "../components/post/PostTypeBadge";
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  Send,
  Trash2,
  Calendar,
  Trophy,
} from "lucide-react";
import PostActions from "../components/post/PostActions";
import { storyService } from "../services/storyService";
import { useToast } from "../components/ui/toast";
import { formatDate, formatRelativeTime } from "../utils/dateUtils";
import { normalizeInteractionContract } from "../utils/interactionContract";

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storyService.getById(id);
      const s = response.data;
      setStory({ ...s, ...normalizeInteractionContract(s) });
      setComments(s.comments || []);
    } catch (err) {
      console.error("Error fetching story:", err);
      setError(err.message || "Failed to load story details");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentClick = () => {
    document.getElementById("comment-input")?.focus();
    document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const data = await storyService.addComment(id, { content: commentText.trim() });
      const nextComments = (data.data.comments || []).map((comment) => ({
        ...comment,
        ...normalizeInteractionContract(comment),
      }));
      const nextCount = data.data.commentsCount ?? nextComments.length;
      setComments(nextComments);
      setStory((prev) => (prev ? { ...prev, commentsCount: nextCount } : prev));
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const data = await storyService.deleteComment(id, commentId);
      const nextComments = (data.data.comments || []).map((comment) => ({
        ...comment,
        ...normalizeInteractionContract(comment),
      }));
      const nextCount = data.data.commentsCount ?? nextComments.length;
      setComments(nextComments);
      setStory((prev) => (prev ? { ...prev, commentsCount: nextCount } : prev));
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !story) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-muted-foreground">{error || "Story not found."}</p>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Go Back
        </Button>
      </div>
    );
  }

  const authorName = story.isAnonymous
    ? "Anonymous"
    : story.author?.name || story.author?.username || "Anonymous";
  const authorInitial = authorName[0]?.toUpperCase();
  const isAuthor = Boolean(story.isOwnStory || story.author?._id === user?._id);
  const storyTypeKey = (story.storyType || "").toLowerCase();
  const visibleTags = (story.tags || []).filter(
    (tag) => tag?.toLowerCase() !== storyTypeKey,
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="py-4 pb-24 space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stories
      </button>

      {/* ── Story Card ─────────────────────────────────────────────────────── */}
      <article className="rounded-xl border border-border bg-card p-5 space-y-4 relative pt-12">
        <PostTypeBadge type="story" className="absolute top-3 left-3" />

        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0 overflow-hidden">
            {!story.isAnonymous && story.author?.profilePicture ? (
              <img
                src={story.author.profilePicture}
                alt={authorName}
                className="h-full w-full object-cover"
              />
            ) : (
              authorInitial
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground">
                {authorName}
              </p>
              <span className="text-xs text-muted-foreground">
                @
                {story.isAnonymous
                  ? "anonymous"
                  : story.author?.username || "unknown"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(story.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-foreground leading-snug break-words">
          {story.title}
        </h1>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div className="text-sm text-foreground/90 leading-relaxed space-y-3 break-words">
          {(story.content || "").split("\n").map((para, i) =>
            para.trim() ? (
              <p key={i} className="whitespace-pre-wrap">
                {para}
              </p>
            ) : (
              <div key={i} className="h-1" />
            ),
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {story.storyType && (
            <Badge variant="outline" className="text-xs font-medium">
              {story.storyType}
            </Badge>
          )}
          {visibleTags.map((tag, index) => (
            <Badge
              key={`${index}-${tag}`}
              className="rounded-full text-xs px-3 py-1 bg-violet-50 text-violet-700 border-0 font-medium"
            >
              #{tag}
            </Badge>
          ))}
          {story.isFeatured && (
            <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-medium">
              ✦ Featured
            </Badge>
          )}
        </div>

        {/* ── Result Card (Success stories) ─────────────────────────────────── */}
        {story.storyType === "Success" &&
          story.result &&
          Object.values(story.result).some(Boolean) && (
            <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400 font-semibold text-sm mb-3">
                <Trophy className="h-4 w-4" />
                Result
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {story.result.rank && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Rank</p>
                    <p className="font-semibold text-foreground">
                      {story.result.rank}
                    </p>
                  </div>
                )}
                {story.result.percentile != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Percentile
                    </p>
                    <p className="font-semibold text-foreground">
                      {story.result.percentile}%
                    </p>
                  </div>
                )}
                {story.result.year && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Year</p>
                    <p className="font-semibold text-foreground">
                      {story.result.year}
                    </p>
                  </div>
                )}
                {story.result.institution && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Institution
                    </p>
                    <p className="font-semibold text-foreground">
                      {story.result.institution}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Unified Action Bar */}
        {story && (
          <PostActions
            postId={story.postId || story._id}
            totalLikes={story.totalLikes}
            totalDislikes={story.totalDislikes}
            totalComments={story.totalComments}
            isLiked={story.isLiked}
            isDisliked={story.isDisliked}
            isBookmarked={story.isBookmarked}
            likesCount={story.likesCount}
            dislikesCount={story.dislikesCount}
            commentsCount={story.commentsCount ?? comments?.length}
            initialInteraction={story.userInteraction ?? story.userVoteStatus}
            initialIsSaved={story.isSaved}
            onCommentClick={handleCommentClick}
            showBorder={true}
          />
        )}
      </article>

      {/* ── Comments Section ────────────────────────────────────────────────── */}
      <section
        id="comments-section"
        className="rounded-xl border border-border bg-card p-5 space-y-4"
      >
        <h2 className="font-semibold text-foreground text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Comments
          <span className="text-muted-foreground font-normal text-sm">
            ({comments.length})
          </span>
        </h2>

        {/* Add comment input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Share your thoughts or encouragement…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                handleAddComment();
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Ctrl+Enter to post
            </span>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!commentText.trim() || commentLoading}
              className="flex items-center gap-1.5"
            >
              {commentLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Post
            </Button>
          </div>
        </div>

        {/* Comment list */}
        {(!comments || comments.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No comments yet. Be the first!
          </p>
        ) : (
          <div className="space-y-4">
            {(comments || []).map((c) => {
              const name = c.isAnonymous
                ? "Anonymous"
                : c.user?.name || c.user?.username || "User";
              const initial = name[0]?.toUpperCase();
              const canDelete =
                isAuthor || c.user?._id === user?._id || c.user === user?._id;

              return (
                <div key={c._id} className="flex gap-3 group">
                  {/* Avatar */}
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium flex-shrink-0 overflow-hidden mt-0.5">
                    {!c.isAnonymous && c.user?.profilePicture ? (
                      <img
                        src={c.user.profilePicture}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StoryDetail;
