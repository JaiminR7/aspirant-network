export const normalizeInteractionContract = (item = {}) => {
  const totalLikes = Number(item.totalLikes ?? item.likesCount ?? 0) || 0;
  const totalDislikes = Number(item.totalDislikes ?? item.dislikesCount ?? 0) || 0;
  const totalComments = Number(
    item.totalComments ?? item.commentsCount ?? item.commentCount ?? item.answerCount ?? 0
  ) || 0;

  const interaction = String(item.userInteraction || item.userVoteStatus || "").toLowerCase();
  const isLiked = Boolean(
    (item.isLiked ?? false) ||
      interaction === "like" ||
      interaction === "liked" ||
      interaction === "upvoted"
  );
  const isDisliked = Boolean(
    (item.isDisliked ?? false) ||
      interaction === "dislike" ||
      interaction === "disliked" ||
      interaction === "downvoted"
  );
  const isBookmarked = Boolean(item.isBookmarked ?? item.isSaved ?? false);

  return {
    totalLikes: Math.max(0, totalLikes),
    totalDislikes: Math.max(0, totalDislikes),
    totalComments: Math.max(0, totalComments),
    isLiked,
    isDisliked,
    isBookmarked
  };
};

export const toLegacyInteractionFields = (contract = {}) => ({
  likesCount: contract.totalLikes ?? 0,
  dislikesCount: contract.totalDislikes ?? 0,
  commentsCount: contract.totalComments ?? 0,
  isSaved: Boolean(contract.isBookmarked),
  userInteraction: contract.isLiked ? "like" : contract.isDisliked ? "dislike" : "none",
  userVoteStatus: contract.isLiked ? "upvoted" : contract.isDisliked ? "downvoted" : "none"
});
