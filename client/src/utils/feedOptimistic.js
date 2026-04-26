const PENDING_FEED_POSTS_KEY = "pendingFeedPosts";

const readPendingFeedPosts = () => {
  try {
    const raw = localStorage.getItem(PENDING_FEED_POSTS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const pushPendingFeedPost = (post) => {
  if (!post || !post._id) return;

  const existing = readPendingFeedPosts();
  const deduped = [post, ...existing.filter((item) => item?._id !== post._id)];

  localStorage.setItem(PENDING_FEED_POSTS_KEY, JSON.stringify(deduped.slice(0, 20)));
};

export const consumePendingFeedPosts = () => {
  const pending = readPendingFeedPosts();
  localStorage.removeItem(PENDING_FEED_POSTS_KEY);
  return pending;
};
