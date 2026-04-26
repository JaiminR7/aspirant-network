import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import PostTypeBadge from "../components/post/PostTypeBadge";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Share2,
  Trophy,
  Calendar,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { storyService } from "../services/storyService";
import { postsService } from "../services/postsService";
import { useToast } from "../components/ui/toast";
import { formatDate, formatRelativeTime } from "../utils/dateUtils";

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [voteStatus, setVoteStatus] = useState("none");
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [copied, setCopied] = useState(false);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storyService.getById(id);
      const s = response.data;
      setStory(s);
      setIsSaved(s.isSaved || false);
      setVoteStatus(s.userVoteStatus || "none");
      setLikesCount(s.likesCount || 0);
      setDislikesCount(s.dislikesCount || 0);
      setComments(s.comments || []);
    } catch (err) {
      console.error("Error fetching story:", err);
      setError(err.message || "Failed to load story details");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type) => {
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      const data = await (type === "upvote" 
        ? storyService.upvote(id) 
        : storyService.downvote(id));
      
      setLikesCount(data.data.likesCount);
      setDislikesCount(data.data.dislikesCount);
      setVoteStatus(data.data.userVoteStatus);
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      addToast({ title: "Login required", description: "Please login to save stories.", variant: "error" });
      return;
    }
    if (savePending) return;

    const previousState = isSaved;
    setIsSaved(!previousState);
    setSavePending(true);

    try {
      if (previousState) {
        await postsService.unsavePost(id);
        addToast({ title: "Removed", description: "Story removed from your library.", variant: "default" });
      } else {
        await postsService.savePost(id);
        addToast({ title: "Saved", description: "Added to your private study collection.", variant: "success" });
      }
    } catch (error) {
      setIsSaved(previousState);
      addToast({ title: "Error", description: "Failed to update library. Try again.", variant: "error" });
    } finally {
      setSavePending(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const data = await storyService.addComment(id, { content: commentText.trim() });
      setComments(data.data.comments || []);
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
      setComments(data.data.comments || []);
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {story.content.split("\n").map((para, i) =>
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
          {visibleTags.map((tag) => (
            <Badge
              key={tag}
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

        {/* ── Action Bar ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-0.5">
            {/* Upvote */}
            <button
              type="button"
              onClick={() => handleVote("upvote")}
              disabled={voteLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60 ${
                voteStatus === "upvoted"
                  ? "text-sky-700"
                  : "text-muted-foreground hover:text-sky-700"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center rounded-full border p-1 ${
                  voteStatus === "upvoted"
                    ? "border-sky-300 bg-sky-100 text-sky-700"
                    : "border-sky-200 bg-sky-50 text-sky-600"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
              </span>
              <span>{likesCount}</span>
            </button>

            {/* Downvote */}
            <button
              type="button"
              onClick={() => handleVote("downvote")}
              disabled={voteLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60 ${
                voteStatus === "downvoted"
                  ? "text-red-700"
                  : "text-muted-foreground hover:text-red-700"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center rounded-full border p-1 ${
                  voteStatus === "downvoted"
                    ? "border-red-300 bg-red-100 text-red-700"
                    : "border-red-200 bg-red-50 text-red-500"
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
              </span>
              <span>{dislikesCount}</span>
            </button>

            {/* Comments anchor */}
            <button
              onClick={() =>
                document
                  .getElementById("comments-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-emerald-700 transition-colors"
            >
              <span className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 p-1">
                <MessageSquare className="h-4 w-4" />
              </span>
              <span>{comments.length}</span>
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Share / copy link */}
            <button
              type="button"
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                copied
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="Copy link"
            >
              {copied ? (
                <LinkIcon className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {copied && <span className="text-xs">Copied!</span>}
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                isSaved
                  ? "bg-primary/10 text-primary scale-105 shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={isSaved ? "Remove from saved" : "Save for later"}
            >
              <Bookmark
                className={`h-4.5 w-4.5 transition-transform duration-300 ${isSaved ? "fill-current" : ""}`}
              />
              <span className="text-xs font-bold">{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
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
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No comments yet. Be the first!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => {
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
