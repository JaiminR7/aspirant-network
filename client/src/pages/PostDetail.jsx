import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import PostActions from "../components/post/PostActions";
import PostContent from "../components/post/PostContent";
import PostHeader from "../components/post/PostHeader";
import PostTags from "../components/post/PostTags";
import PostTypeBadge from "../components/post/PostTypeBadge";
import { postsService } from "../services/postsService";
import { resourceService } from "../services/resourceService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/toast";
import {
  normalizeInteractionContract,
  toLegacyInteractionFields,
} from "../utils/interactionContract";

const MAX_COMMENT_LENGTH = 300;

// Simple in-memory cache to make reopening posts instant
const POST_CACHE = new Map();
const COMMENTS_CACHE = new Map();

const PostSkeleton = () => (
  <div className="space-y-4 py-4">
    <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
    <article className="content-card space-y-4 pt-10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-12 w-full bg-muted animate-pulse rounded-lg mt-6" />
    </article>
  </div>
);

const CommentSkeleton = () => (
  <div className="space-y-3 mt-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-lg border border-border p-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
      </div>
    ))}
  </div>
);

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToast } = useToast();
  const perfRef = useRef({ start: 0 });

  const [post, setPost] = useState(POST_CACHE.get(id) || null);
  const [comments, setComments] = useState(COMMENTS_CACHE.get(id) || []);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(!POST_CACHE.has(id));
  const [commentsLoading, setCommentsLoading] = useState(
    !COMMENTS_CACHE.has(id),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Rating states
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const fetchData = async () => {
    perfRef.current.start = performance.now();
    const isDev = import.meta.env.DEV;

    if (isDev) console.log(`[PERF] PostDetail navigation start: ${id}`);

    // If we have cached post, we already set it in state.
    // We still re-fetch in background for fresh data (SWR style).
    if (!POST_CACHE.has(id)) {
      setLoading(true);
    }
    setError("");

    try {
      // Phase 1: Critical Post Data
      const apiStart = performance.now();
      const postResponse = await postsService.getPostById(id);
      const fetchedPost = {
        ...postResponse.data,
        ...toLegacyInteractionFields(
          normalizeInteractionContract(postResponse.data),
        ),
      };

      if (isDev) {
        console.log(
          `[PERF] Post API time: ${(performance.now() - apiStart).toFixed(2)}ms`,
        );
      }

      setPost(fetchedPost);
      POST_CACHE.set(id, fetchedPost);
      setLoading(false);

      // Phase 1.5: Fetch user rating if it's a resource
      if (token && fetchedPost.sourceModel === "Resource") {
        try {
          const ratingData = await resourceService.getUserRating(
            fetchedPost.sourceId,
          );
          setUserRating(ratingData.data.userRating || 0);
        } catch (err) {
          console.warn("Failed to fetch user rating for post resource:", err);
        }
      }

      // Phase 2: Non-Critical Comments
      fetchComments(id);
    } catch (fetchError) {
      if (!post) {
        setError(
          fetchError?.response?.data?.message || "Failed to load post details.",
        );
      }
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    const isDev = import.meta.env.DEV;
    const start = performance.now();

    try {
      const commentsResponse = await postsService.getCommentsByPost(postId);
      const fetchedComments = commentsResponse.data || [];

      if (isDev) {
        console.log(
          `[PERF] Comments fetch time: ${(performance.now() - start).toFixed(2)}ms`,
        );
        console.log(
          `[PERF] Total render ready: ${(performance.now() - perfRef.current.start).toFixed(2)}ms`,
        );
      }

      setComments(fetchedComments);
      COMMENTS_CACHE.set(postId, fetchedComments);
    } catch (err) {
      console.warn(
        "[PostDetail] Graceful degradation: comments failed to load",
        err,
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const visibleComments = useMemo(
    () =>
      comments.filter(
        (comment) =>
          comment?.userId &&
          typeof comment.userId === "object" &&
          Boolean(comment.userId.name),
      ),
    [comments],
  );

  const actionBarCount = post?.commentsCount ?? visibleComments.length;

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || submitting) return;

    if (trimmed.length < 2) {
      setError("Comment must be at least 2 characters.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const response = await postsService.addComment(id, trimmed);
      const newComment = response.data?.comment;

      if (newComment) {
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);
        COMMENTS_CACHE.set(id, updatedComments);
      }

      setCommentText("");
      setPost((prev) => {
        if (!prev) return prev;
        const nextCount =
          response.data?.totalComments ??
          response.data?.commentsCount ??
          prev.commentsCount + 1;
        const updatedPost = {
          ...prev,
          commentsCount: nextCount,
          totalComments: nextCount,
        };
        POST_CACHE.set(id, updatedPost);
        return updatedPost;
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message || "Unable to add comment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = async (rating) => {
    if (!token) {
      addToast({
        title: "Login required",
        description: "Please login to rate resources.",
        variant: "error",
      });
      return;
    }

    if (!post || post.sourceModel !== "Resource") return;

    setRatingLoading(true);
    try {
      await resourceService.rate(post.sourceId, rating);
      setUserRating(rating);
      // We don't necessarily have a rating count in the post model itself
      // as it might be a denormalized view, but we can update state if needed.
      addToast({
        title: "Rating updated",
        description: `You rated this ${rating} stars.`,
        variant: "success",
      });

      // Refresh post data to get updated aggregate if it exists
      const postResponse = await postsService.getPostById(id);
      const normalizedPost = {
        ...postResponse.data,
        ...toLegacyInteractionFields(
          normalizeInteractionContract(postResponse.data),
        ),
      };
      setPost(normalizedPost);
      POST_CACHE.set(id, normalizedPost);
    } catch (error) {
      console.error("Error rating resource from post:", error);
      addToast({
        title: "Error",
        description: "Failed to submit rating.",
        variant: "error",
      });
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading && !post) {
    return <PostSkeleton />;
  }

  if (error && !post) {
    return (
      <div className="space-y-4 py-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 animate-in fade-in duration-500">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="hover:bg-muted/50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Button>

      <article className="content-card space-y-1 relative pt-10">
        <PostTypeBadge type={post.type} className="absolute top-3 left-3" />
        <PostHeader
          author={post.author || post.userId}
          exam={post.exam}
          createdAt={post.createdAt}
        />
        <PostContent
          title={post.title}
          content={post.description}
          type={post.type}
          fileUrl={post.fileUrl}
          fileType={post.fileType}
          resourceId={post.sourceModel === "Resource" ? post.sourceId : null}
        />
        <PostTags tags={post.tags || []} />

        {/* 1-5 Star Rating for Resources */}
        {post.type === "resource" && (
          <div className="py-3 px-4 mb-2 bg-secondary/20 rounded-xl border border-border/50 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRate(star);
                  }}
                  disabled={ratingLoading || !token}
                  className={`transition-all duration-200 transform active:scale-90 ${
                    !token ? "cursor-default" : "hover:scale-110"
                  } ${ratingLoading ? "opacity-50" : "opacity-100"}`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoverRating || userRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {userRating > 0 ? (
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Your Rating: {userRating} Stars
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {token ? "Tap stars to rate this resource" : "Sign in to rate"}
              </p>
            )}
          </div>
        )}

        <PostActions
          postId={post._id}
          totalLikes={post.totalLikes}
          totalDislikes={post.totalDislikes}
          totalComments={post.totalComments}
          isLiked={post.isLiked}
          isDisliked={post.isDisliked}
          isBookmarked={post.isBookmarked}
          likesCount={post.likesCount}
          dislikesCount={post.dislikesCount}
          commentsCount={actionBarCount}
          initialInteraction={post.userInteraction}
          onCommentClick={() => {
            document.getElementById("post-comment-input")?.focus();
          }}
          onCountsChange={(next) => {
            setPost((prev) => {
              if (!prev) return prev;
              const updated = {
                ...prev,
                ...toLegacyInteractionFields(next),
                totalLikes: next.totalLikes,
                totalDislikes: next.totalDislikes,
                totalComments:
                  next.totalComments ??
                  prev.totalComments ??
                  prev.commentsCount ??
                  0,
                isLiked: next.isLiked,
                isDisliked: next.isDisliked,
                isBookmarked: next.isBookmarked,
              };
              POST_CACHE.set(id, updated);
              return updated;
            });
          }}
        />
      </article>

      <section className="content-card">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Comments
        </h2>

        {error && (
          <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitComment} className="space-y-2 mb-5">
          <div className="relative">
            <Textarea
              id="post-comment-input"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (error) setError("");
              }}
              placeholder="Write your comment…"
              maxLength={MAX_COMMENT_LENGTH}
              className="min-h-[90px] resize-none pr-14 focus:ring-1 focus:ring-primary/30"
            />
            {commentText.length > 0 && (
              <span className="absolute bottom-2 right-3 text-xs text-muted-foreground select-none">
                {commentText.length}/{MAX_COMMENT_LENGTH}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting || commentText.trim().length < 2}
          >
            {submitting ? "Posting…" : "Post Comment"}
          </Button>
        </form>

        {commentsLoading && visibleComments.length === 0 ? (
          <CommentSkeleton />
        ) : (
          <div className="space-y-3">
            {visibleComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No comments yet. Be the first to contribute.
              </p>
            ) : (
              visibleComments.map((comment) => {
                if (!comment.userId || typeof comment.userId !== "object")
                  return null;
                const userName = comment.userId.name;
                if (!userName) return null;

                return (
                  <div
                    key={comment._id}
                    className="rounded-lg border border-border p-3 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default PostDetail;
