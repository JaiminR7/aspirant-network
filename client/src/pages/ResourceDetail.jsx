import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import PostActions from "../components/post/PostActions";
import PostTypeBadge from "../components/post/PostTypeBadge";
import { resourceService } from "../services/resourceService";
import { formatDate } from "../utils/dateUtils";
import {
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  Clock,
  Bookmark,
  Share2,
  Loader2,
  Star,
  MessageSquare,
  Send,
} from "lucide-react";
import { postsService } from "../services/postsService";
import { useToast } from "../components/ui/toast";
import { normalizeInteractionContract } from "../utils/interactionContract";

const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    setLoading(true);
    try {
      const response = await resourceService.getById(id);
      const data = response.data;
      const interaction = normalizeInteractionContract(data);
      setResource({ ...data, ...interaction });
      setIsSaved(interaction.isBookmarked);
      
      // Fetch user rating if logged in
      if (token) {
        try {
          const ratingRes = await resourceService.getUserRating(id);
          setUserRating(ratingRes.data.userRating);
        } catch (ratingErr) {
          console.warn("Failed to fetch user rating:", ratingErr);
        }
      }
    } catch (error) {
      console.error("Error fetching resource:", error);
      setError(error.message || "Failed to load resource details");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    if (!resource?.content?.url && !resource?.content?.externalLink) return;

    try {
      const url = resource.content.url || resource.content.externalLink;
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error viewing resource:", error);
    }
  };

  const handleDownload = async () => {
    if (!resource) return;

    if (resource.type === "Link" || resource.type === "Video") {
      const externalUrl =
        resource.content?.externalLink || resource.content?.url;
      if (externalUrl) window.open(externalUrl, "_blank");
      return;
    }

    try {
      // Step 1: Get the Cloudinary URL from backend (also increments download count)
      const data = await resourceService.getDownloadUrl(id);
      console.log("[download] got URL:", data.downloadUrl);

      if (!data.success || !data.downloadUrl)
        throw new Error("No download URL");

      // Step 2: Fetch the file directly from Cloudinary as a blob
      // Cloudinary allows cross-origin fetch (permissive CORS headers)
      const fileResponse = await fetch(data.downloadUrl);
      if (!fileResponse.ok)
        throw new Error("Failed to fetch file from Cloudinary");

      const blob = await fileResponse.blob();

      // Step 3: Trigger browser download with explicit .pdf filename
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "pdf.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      setTimeout(() => fetchResource(), 500);
    } catch (error) {
      console.error("[download] error:", error);
      alert("Download failed. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!token) {
      addToast({ title: "Login required", description: "Please login to save resources.", variant: "error" });
      return;
    }
    if (savePending) return;

    const previousState = isSaved;
    const postId = resource?.postId || resource?._id;
    if (!postId) return;

    setIsSaved(!previousState);
    setSavePending(true);
    try {
      if (previousState) {
        await postsService.unsavePost(postId);
        addToast({ title: "Removed", description: "Resource removed from your library.", variant: "default" });
      } else {
        await postsService.savePost(postId);
        addToast({ title: "Saved", description: "Resource added to your library.", variant: "success" });
      }
      setResource((prev) => (prev ? { ...prev, isSaved: !previousState } : prev));
    } catch (error) {
      setIsSaved(previousState);
      addToast({ title: "Error", description: "Failed to update saved state.", variant: "error" });
    } finally {
      setSavePending(false);
    }
  };

  const handleRate = async (rating) => {
    if (!token) {
      addToast({ title: "Login required", description: "Please login to rate resources.", variant: "error" });
      return;
    }
    
    setRatingLoading(true);
    try {
      const response = await resourceService.rate(id, rating);
      setUserRating(rating);
      setResource(prev => ({
        ...prev,
        rating: {
          average: response.data.averageRating,
          count: response.data.ratingCount
        }
      }));
      addToast({ title: "Rating updated", description: `You rated this ${rating} stars.`, variant: "success" });
    } catch (error) {
      console.error("Error rating resource:", error);
      addToast({ title: "Error", description: "Failed to submit rating.", variant: "error" });
    } finally {
      setRatingLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const response = await resourceService.addComment(id, commentText.trim());
      const nextComments = response.data.comments || [];
      const nextCount = response.data.commentsCount ?? response.data.commentCount ?? nextComments.length;
      setResource(prev => ({
        ...prev,
        comments: nextComments,
        commentCount: nextCount,
        commentsCount: nextCount
      }));
      setCommentText("");
      addToast({ title: "Comment added", description: "Your thought has been shared.", variant: "success" });
    } catch (error) {
      console.error("Error adding comment:", error);
      addToast({ title: "Error", description: error.message || "Failed to add comment.", variant: "error" });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCommentClick = () => {
    document.querySelector('textarea[placeholder*="Share your thoughts"]')?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-destructive mb-4">
          {error || "Resource not found"}
        </div>
        <Button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/")
          }
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() =>
          window.history.length > 1 ? navigate(-1) : navigate("/")
        }
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Resource Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6 relative pt-12">
        <PostTypeBadge type="resource" className="absolute top-3 left-3" />

        {/* 1️⃣ HEADER SECTION */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
              {resource.createdBy?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {resource.createdBy?.name || "Anonymous"}
                </span>
                <span className="text-muted-foreground text-sm">
                  @{resource.createdBy?.username || "anonymous"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(resource.createdAt)}</span>
                <span>·</span>
                <Download className="w-3 h-3" />
                <span>{resource.downloadCount || 0} downloads</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              <span>{resource.rating?.average?.toFixed(1) || "0.0"}</span>
              <span className="text-xs opacity-70">({resource.rating?.count || 0} ratings)</span>
            </div>
            <Badge className="rounded-full px-3 py-1">{resource.type}</Badge>
            {resource.isVerified && (
              <Badge className="rounded-full px-3 py-1 bg-green-500/10 text-green-600 border-0">
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* 2️⃣ TITLE SECTION */}
        <h1 className="text-2xl font-semibold text-foreground">
          {resource.title}
        </h1>

        {/* 3️⃣ DESCRIPTION SECTION */}
        {resource.description && (
          <p className="text-muted-foreground leading-relaxed">
            {resource.description}
          </p>
        )}

        {/* 4️⃣ THUMBNAIL / PREVIEW SECTION */}
        {resource.type === "Image" && resource.content?.url && (
          <div className="flex justify-center">
            <div className="w-96 max-w-md rounded-lg overflow-hidden border shadow-sm">
              <img
                src={resource.content.url}
                alt={resource.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        )}

        {/* 5️⃣ TAGS SECTION */}
        {(resource.subjectName ||
          resource.topicName ||
          resource.systemTags?.length > 0 ||
          resource.userTags?.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {resource.subjectName && (
              <Badge className="rounded-full px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 font-medium">
                {resource.subjectName}
              </Badge>
            )}
            {resource.topicName && (
              <Badge className="rounded-full px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 font-medium">
                {resource.topicName}
              </Badge>
            )}
            {resource.systemTags?.map((tag, idx) => (
              <Badge
                key={idx}
                className="rounded-full px-3 py-1 bg-muted text-muted-foreground border-0 font-medium"
              >
                {tag}
              </Badge>
            ))}
            {resource.userTags?.map((tag, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="rounded-full px-3 py-1"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Rating Interaction Section */}
        <div className="bg-secondary/30 rounded-xl p-5 border border-border flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-foreground">
            {userRating > 0 ? "Update your rating" : "Rate this resource"}
          </p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRate(star)}
                disabled={ratingLoading || !token}
                className={`transition-all duration-200 transform active:scale-95 ${
                  !token ? "cursor-default" : "hover:scale-110"
                } ${ratingLoading ? "opacity-50" : "opacity-100"}`}
                title={!token ? "Login to rate" : `Rate ${star} stars`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || userRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {userRating > 0 && (
            <p className="text-xs text-muted-foreground">
              You've rated this resource {userRating} out of 5 stars
            </p>
          )}
          {!token && (
            <p className="text-xs text-muted-foreground italic">
              Please sign in to rate resources
            </p>
          )}
        </div>

        {/* 6️⃣ ACTION BUTTONS SECTION */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <div className="w-full mb-2">
            <PostActions
              postId={resource.postId || resource._id}
              totalLikes={resource.totalLikes}
              totalDislikes={resource.totalDislikes}
              totalComments={resource.totalComments}
              isLiked={resource.isLiked}
              isDisliked={resource.isDisliked}
              isBookmarked={resource.isBookmarked}
              likesCount={resource.likesCount}
              dislikesCount={resource.dislikesCount}
              commentsCount={resource.commentsCount ?? resource.commentCount ?? resource.comments?.length}
              initialInteraction={resource.userInteraction ?? resource.userVoteStatus}
              initialIsSaved={resource.isSaved}
              onCommentClick={handleCommentClick}
              size="md"
              showBorder={false}
            />
          </div>

          <Button onClick={handleDownload} size="lg">
            {resource.type === "Link" || resource.type === "Video" ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>

          <Button 
            variant={isSaved ? "secondary" : "outline"} 
            size="lg" 
            onClick={handleSave}
            className={`transition-all duration-300 ${isSaved ? "bg-primary/10 text-primary border-primary/20" : ""}`}
          >
            <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Saved to Library" : "Save for Later"}
          </Button>

          <Button variant="outline" size="lg">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* 7️⃣ COMMENTS SECTION */}
        <div className="pt-8 border-t space-y-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            Comments
            <span className="text-muted-foreground font-normal text-sm">
              ({resource.commentsCount ?? resource.commentCount ?? resource.comments?.length ?? 0})
            </span>
          </h2>

          {/* Add Comment Input */}
          <div className="space-y-3">
            <textarea
              placeholder="Share your thoughts on this resource..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!commentText.trim() || commentLoading}
                className="rounded-full"
              >
                {commentLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post Comment
              </Button>
            </div>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {!resource.comments || resource.comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm italic">
                No comments yet. Be the first to start the conversation!
              </p>
            ) : (
              resource.comments.map((comment, idx) => (
                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {comment.commentedBy?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {comment.commentedBy?.name || "Anonymous"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-2xl rounded-tl-none border border-border/30">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;
