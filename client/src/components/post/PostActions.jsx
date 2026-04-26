import { useEffect, useState } from "react";
import { MessageSquare, ThumbsDown, ThumbsUp, Bookmark } from "lucide-react";
import { postsService } from "../../services/postsService";
import { useToast } from "../ui/toast";

const PostActions = ({
  postId,
  initialLikes = 0,
  initialDislikes = 0,
  initialComments = 0,
  initialInteraction = "none",
  initialIsSaved = false,
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
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const [interaction, setInteraction] = useState(initialInteraction);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [pending, setPending] = useState(false);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
    setCommentsCount(initialComments);
    setInteraction(initialInteraction);
    setIsSaved(initialIsSaved);
  }, [initialLikes, initialDislikes, initialComments, initialInteraction, initialIsSaved]);

  const applyOptimistic = (type) => {
    const prev = { likes, dislikes, interaction };

    let nextLikes = likes;
    let nextDislikes = dislikes;
    let nextInteraction = interaction;

    if (type === "like") {
      if (interaction === "like") {
        nextLikes -= 1;
        nextInteraction = "none";
      } else if (interaction === "dislike") {
        nextDislikes -= 1;
        nextLikes += 1;
        nextInteraction = "like";
      } else {
        nextLikes += 1;
        nextInteraction = "like";
      }
    }

    if (type === "dislike") {
      if (interaction === "dislike") {
        nextDislikes -= 1;
        nextInteraction = "none";
      } else if (interaction === "like") {
        nextLikes -= 1;
        nextDislikes += 1;
        nextInteraction = "dislike";
      } else {
        nextDislikes += 1;
        nextInteraction = "dislike";
      }
    }

    setLikes(Math.max(0, nextLikes));
    setDislikes(Math.max(0, nextDislikes));
    setInteraction(nextInteraction);

    return prev;
  };

  const toggle = async (type) => {
    if (pending) return;

    const prev = applyOptimistic(type);
    setPending(true);

    try {
      const response = await postsService.toggleInteraction(postId, type);
      console.debug("[interaction] response", response);

      setLikes(response.data.likesCount);
      setDislikes(response.data.dislikesCount);
      setInteraction(response.data.userInteraction);

      if (onCountsChange) {
        onCountsChange({
          likesCount: response.data.likesCount,
          dislikesCount: response.data.dislikesCount,
          commentsCount,
        });
      }
    } catch (error) {
      setLikes(prev.likes);
      setDislikes(prev.dislikes);
      setInteraction(prev.interaction);
    } finally {
      setPending(false);
    }
  };
  
  const handleSave = async (e) => {
    e.stopPropagation();
    if (savePending) return;

    const previousState = isSaved;
    setIsSaved(!previousState);
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
      setIsSaved(previousState);
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
    <div className={`flex items-center ${gap} ${textSize} text-muted-foreground pt-2 ${showBorder ? "border-t border-border" : ""}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle("like");
        }}
        className={`inline-flex items-center gap-2 ${interaction === "like" ? "text-sky-700 font-semibold" : ""}`}
      >
        <ThumbsUp className={iconSize} />
        {likes}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle("dislike");
        }}
        className={`inline-flex items-center gap-2 ${interaction === "dislike" ? "text-red-700 font-semibold" : ""}`}
      >
        <ThumbsDown className={iconSize} />
        {dislikes}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCommentClick?.();
        }}
        className="inline-flex items-center gap-2"
      >
        <MessageSquare className={iconSize} />
        {commentsCount}
      </button>

      <button
        type="button"
        onClick={handleSave}
        className={`ml-auto p-1.5 rounded-lg transition-all duration-300 ${
          isSaved 
            ? "text-primary bg-primary/10 hover:bg-primary/20 scale-110" 
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
        aria-label={isSaved ? "Remove from saved" : "Save for later"}
      >
        <Bookmark 
          className={`${iconSize} transition-transform duration-300 ${isSaved ? "fill-current" : ""}`} 
        />
      </button>
    </div>
  );
};

export default PostActions;
