const normalizeInteractionType = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw === 'like' || raw === 'liked' || raw === 'upvoted') return 'like';
  if (raw === 'dislike' || raw === 'disliked' || raw === 'downvoted') return 'dislike';
  return 'none';
};

const buildInteractionContract = ({
  totalLikes = 0,
  totalDislikes = 0,
  totalComments = 0,
  interaction = 'none',
  isBookmarked = false
} = {}) => {
  const normalized = normalizeInteractionType(interaction);
  return {
    totalLikes: Math.max(0, Number(totalLikes) || 0),
    totalDislikes: Math.max(0, Number(totalDislikes) || 0),
    totalComments: Math.max(0, Number(totalComments) || 0),
    isLiked: normalized === 'like',
    isDisliked: normalized === 'dislike',
    isBookmarked: Boolean(isBookmarked)
  };
};

const applyInteractionContract = (payload = {}, source = {}) => {
  const contract = buildInteractionContract(source);
  const interaction = normalizeInteractionType(source.interaction);

  return {
    ...payload,
    ...contract,
    // Backward-compatible aliases for existing UI
    likesCount: contract.totalLikes,
    dislikesCount: contract.totalDislikes,
    commentsCount: contract.totalComments,
    isSaved: contract.isBookmarked,
    userInteraction: interaction,
    userVoteStatus:
      interaction === 'like'
        ? 'upvoted'
        : interaction === 'dislike'
          ? 'downvoted'
          : 'none'
  };
};

module.exports = {
  normalizeInteractionType,
  buildInteractionContract,
  applyInteractionContract
};
