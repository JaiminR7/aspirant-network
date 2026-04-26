import Comment from '../../models/Comment.js';
import Post from '../../models/Post.js';
import allowedCommentsModule from '../../constants/allowedComments.js';
import {
  randomDateAfter
} from './utils.mjs';

const { COMMENT_MAP } = allowedCommentsModule;

/**
 * Weighted comment count:
 *   60% → 0–5
 *   30% → 6–8
 *   10% → 9–10
 */
const getWeightedCommentCount = () => {
  const roll = Math.random();
  if (roll < 0.60) {
    return Math.floor(Math.random() * 6);          // 0–5
  }
  if (roll < 0.90) {
    return 6 + Math.floor(Math.random() * 3);     // 6–8
  }
  return 9 + Math.floor(Math.random() * 2);        // 9–10
};

const stableHash = (value) => {
  let hash = 0;
  const str = String(value || '');

  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  return hash;
};

/**
 * Returns a deterministically shuffled copy of the whitelist for this post type.
 * Seed is derived from post._id so each post gets a unique order.
 */
const getShuffledWhitelistForPost = (post) => {
  const postType = post.type || 'question';
  const whitelist = COMMENT_MAP[postType] || COMMENT_MAP.question;
  const seed = `${post._id}|${postType}`;

  return [...whitelist].sort((a, b) => {
    const scoreA = stableHash(`${seed}|${a}`);
    const scoreB = stableHash(`${seed}|${b}`);
    return scoreA - scoreB;
  });
};

export const seedComments = async ({ users, postContexts }) => {
  const commentDocs = [];
  const commentsPerPost = new Map();

  for (const postContext of postContexts) {
    const { post, authorId, engagementTier } = postContext;

    // Weighted comment count
    const commentCount = Math.min(getWeightedCommentCount(), 10);

    if (commentCount === 0) {
      commentsPerPost.set(post._id.toString(), 0);
      continue;
    }

    // Get shuffled whitelist for this post's type
    const shuffledWhitelist = getShuffledWhitelistForPost(post);

    // Cap commentCount to available unique comments (max 10 per whitelist)
    const maxPossible = Math.min(commentCount, shuffledWhitelist.length);

    // Get eligible commenters (exclude post author), shuffle them
    const eligible = users.filter((u) => u._id.toString() !== authorId.toString());
    const shuffledUsers = [...eligible].sort(() => stableHash(`${post._id}|user|${Math.random()}`) - 0.5);
    const selectedUsers = shuffledUsers.slice(0, maxPossible);

    const usedUserIds = new Set();
    const usedTexts = new Set();

    // Assign users[i] → comments[i] (no random re-pick; strict index assignment)
    selectedUsers.forEach((commenter, index) => {
      const commenterId = commenter._id.toString();

      // Dedup guard (should not be needed given shuffle, but enforced for safety)
      if (usedUserIds.has(commenterId)) return;

      const commentText = shuffledWhitelist[index];
      if (!commentText || usedTexts.has(commentText)) return;

      usedUserIds.add(commenterId);
      usedTexts.add(commentText);

      commentDocs.push({
        userId: commenter._id,
        postId: post._id,
        text: commentText,
        createdAt: randomDateAfter(post.createdAt),
        updatedAt: randomDateAfter(post.createdAt)
      });
    });

    commentsPerPost.set(post._id.toString(), usedTexts.size);
  }

  if (commentDocs.length > 0) {
    await Comment.insertMany(commentDocs, { ordered: false });
  }

  const bulkOps = postContexts.map(({ post }) => ({
    updateOne: {
      filter: { _id: post._id },
      update: {
        $set: { commentsCount: commentsPerPost.get(post._id.toString()) || 0 }
      }
    }
  }));

  if (bulkOps.length > 0) {
    await Post.bulkWrite(bulkOps);
  }

  return commentDocs.length;
};
