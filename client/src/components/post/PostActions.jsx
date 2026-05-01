import { useEffect, useState, useRef } from "react";
import { MessageSquare, ThumbsDown, ThumbsUp, Bookmark } from "lucide-react";
import { postsService } from "../../services/postsService";
import { useToast } from "../ui/toast";
import { normalizeInteractionContract } from "../../utils/interactionContract";

/**
 * Normalize any mix of API response shapes into canonical interaction state.
 * Uses ?? (null-coalescing) NOT || so that 0 is never treated as "missing".
 */
const resolveInitialState = (props) => {
  const raw = {
    totalLikes:     props.totalLikes     ?? props.likesCount      ?? props.initialLikes    ?? 0,
    totalDislikes:  props.totalDislikes  ?? props.dislikesCount    ?? props.initialDislikes ?? 0,
    totalComments:  props.totalComments  ?? props.commentsCount    ?? props.initialComments ?? 0,
    likesCount:     props.likesCount     ?? props.totalLikes       ?? props.initialLikes    ?? 0,
    dislikesCount:  props.dislikesCount  ?? props.totalDislikes    ?? props.initialDislikes ?? 0,
    commentsCount:  props.commentsCount  ?? props.totalComments    ?? props.initialComments ?? 0,
    isLiked:        props.isLiked,
    isDisliked:     props.isDisliked,
    isBookmarked:   props.isBookmarked   ?? props.initialIsSaved   ?? false,
    isSaved:        props.isSaved        ?? props.initialIsSaved   ?? false,
    userInteraction: props.initialInteraction ?? props.userInteraction ?? "none",
    userVoteStatus:  props.userVoteStatus ?? props.initialInteraction ?? "none",
  };

  return normalizeInteractionContract(raw);
};

const PostActions = ({
  postId,
  // Canonical fields (new contract)
  totalLikes,
  totalDislikes,
  totalComments,
  isLiked,
  isDisliked,
  isBookmarked,
  // Legacy fields (backward compat — detail pages still send these)
  likesCount,
  dislikesCount,
  commentsCount,
  initialLikes,
  initialDislikes,
  initialComments,
  initialInteraction,
  initialIsSaved,
  isSaved,
  userInteraction,
  userVoteStatus,
  // UI config
  onCommentClick,
  onCountsChange,
  size = "md",
  showBorder = true,
}) => {
  const { addToast } = useToast();
  
  const sizeClasses = {
    sm: { icon: "h-3 w-3", text: "text-xs", gap: "gap-4" },
    md: { icon: "h-4 w-4", text: "text-sm", gap: "gap-6" },
    lg: { icon: "h-5 w-5", text: "text-base", gap: "gap-8" },
  };

  const { icon: iconSize, text: textSize, gap } = sizeClasses[size];

  // Resolve ONCE from all prop variants → canonical state
  const initial = resolveInitialState({
    totalLikes, totalDislikes, totalComments,
    likesCount, dislikesCount, commentsCount,
    initialLikes, initialDislikes, initialComments,
    isLiked, isDisliked, isBookmarked,
    isSaved, initialIsSaved,
    initialInteraction, userInteraction, userVoteStatus,
  });

  const [localLikes, setLocalLikes] = useState(initial.totalLikes);
  const [localDislikes, setLocalDislikes] = useState(initial.totalDislikes);
  const [localComments, setLocalComments] = useState(initial.totalComments);
  const [interaction, setInteraction] = useState(
    initial.isLiked ? "like" : initial.isDisliked ? "dislike" : "none"
  );
  const [localSaved, setLocalSaved] = useState(initial.isBookmarked);
  const [pending, setPending] = useState(false);
  const [savePending, setSavePending] = useState(false);

  // Guard: don't let useEffect overwrite optimistic state while toggle is in-flight
  const toggleInFlight = useRef(false);

  // Re-sync from props when parent provides genuinely new data
  useEffect(() => {
    if (toggleInFlight.current) return;

    const next = resolveInitialState({
      totalLikes, totalDislikes, totalComments,
      likesCount, dislikesCount, commentsCount,
      initialLikes, initialDislikes, initialComments,
      isLiked, isDisliked, isBookmarked,
      isSaved, initialIsSaved,
      initialInteraction, userInteraction, userVoteStatus,
    });

    setLocalLikes(next.totalLikes);
    setLocalDislikes(next.totalDislikes);
    setLocalComments(next.totalComments);
    setInteraction(next.isLiked ? "like" : next.isDisliked ? "dislike" : "none");
    setLocalSaved(next.isBookmarked);
  }, [
    totalLikes, totalDislikes, totalComments,
    likesCount, dislikesCount, commentsCount,
    initialLikes, initialDislikes, initialComments,
    isLiked, isDisliked, isBookmarked,
    isSaved, initialIsSaved,
    initialInteraction, userInteraction, userVoteStatus,
  ]);

  const toggle = async (type) => {
    if (pending) return;

    // Snapshot CURRENT visible state for rollback
    const prev = { likes: localLikes, dislikes: localDislikes, interaction };

    // Optimistic: apply delta to CURRENT visible counts (not props)
    let nextLikes = localLikes;
    let nextDislikes = localDislikes;
    let nextInteraction = interaction;

    if (type === "like") {
      if (interaction === "like") {
        nextLikes -= 1;
        nextInteraction = "none";
      } else {
        if (interaction === "dislike") nextDislikes -= 1;
        nextLikes += 1;
        nextInteraction = "like";
      }
    } else {
      if (interaction === "dislike") {
        nextDislikes -= 1;
        nextInteraction = "none";
      } else {
        if (interaction === "like") nextLikes -= 1;
        nextDislikes += 1;
        nextInteraction = "dislike";
      }
    }

    setLocalLikes(Math.max(0, nextLikes));
    setLocalDislikes(Math.max(0, nextDislikes));
    setInteraction(nextInteraction);
    setPending(true);
    toggleInFlight.current = true;

    try {
      const response = await postsService.toggleInteraction(postId, type);
      console.debug("[interaction] response", response);

      // Replace with server truth — this is the authoritative count
      const truth = normalizeInteractionContract(response.data || {});
      setLocalLikes(truth.totalLikes);
      setLocalDislikes(truth.totalDislikes);
      setInteraction(truth.isLiked ? "like" : truth.isDisliked ? "dislike" : "none");
      setLocalSaved(truth.isBookmarked);

      if (onCountsChange) {
        onCountsChange({
          ...truth,
          likesCount: truth.totalLikes,
          dislikesCount: truth.totalDislikes,
          commentsCount: localComments,
        });
      }
    } catch (error) {
      // Rollback to pre-click state
      setLocalLikes(prev.likes);
      setLocalDislikes(prev.dislikes);
      setInteraction(prev.interaction);
    } finally {
      setPending(false);
      toggleInFlight.current = false;
    }
  };
  
  const handleSave = async (e) => {
    e.stopPropagation();
    if (savePending) return;

    const previousState = localSaved;
    setLocalSaved(!previousState);
    setSavePending(true);

    try {
      if (previousState) {
        await postsService.unsavePost(postId);
        addToast({
          title: "Removed from library",
          description: "Content removed from your saved list.",
          variant: "default"
        });
      } else {
        await postsService.savePost(postId);
        addToast({
          title: "Saved for later",
          description: "Added to your private study collection.",
          variant: "success"
        });
      }
    } catch (error) {
      setLocalSaved(previousState);
      addToast({
        title: "Action failed",
        description: "Could not update save status. Please try again.",
        variant: "error"
      });
    } finally {
      setSavePending(false);
    }
  };

  return (
    <div className={`flex items-center justify-between ${textSize} text-muted-foreground pt-3 ${showBorder ? "border-t border-border" : ""}`}>
      <div className={`flex items-center ${gap}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle("like");
          }}
          className={`flex items-center gap-1.5 transition-colors group ${
            interaction === "like" ? "text-sky-600 font-semibold" : "hover:text-sky-600"
          }`}
        >
          <ThumbsUp 
            className={`${iconSize} transition-transform group-hover:scale-110 ${
              interaction === "like" ? "fill-sky-600/10" : ""
            }`} 
          />
          <span>{localLikes}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle("dislike");
          }}
          className={`flex items-center gap-1.5 transition-colors group ${
            interaction === "dislike" ? "text-red-600 font-semibold" : "hover:text-red-600"
          }`}
        >
          <ThumbsDown 
            className={`${iconSize} transition-transform group-hover:scale-110 ${
              interaction === "dislike" ? "fill-red-600/10" : ""
            }`} 
          />
          <span>{localDislikes}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCommentClick?.();
          }}
          className="flex items-center gap-1.5 transition-colors group hover:text-emerald-600"
        >
          <MessageSquare className={`${iconSize} transition-transform group-hover:scale-110`} />
          <span>{localComments}</span>
        </button>
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={handleSave}
          className={`p-1.5 rounded-md transition-all duration-300 ${
            localSaved 
              ? "text-primary bg-primary/5 scale-105" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-label={localSaved ? "Remove from saved" : "Save for later"}
        >
          <Bookmark 
            className={`${iconSize} transition-transform duration-300 ${localSaved ? "fill-current" : ""}`} 
          />
        </button>
      </div>
    </div>
  );
};

export default PostActions;
