import Interaction from '../../models/Interaction.js';
import Post from '../../models/Post.js';

import {
  randomDateAfter,
  randomInt,
  selectUniqueUsers
} from './utils.mjs';

const getInteractionSplitByTier = (tier, maxPossible) => {
  if (maxPossible <= 0 || tier === 'zero') {
    return { likes: 0, dislikes: 0 };
  }

  let likes;
  let dislikes;

  if (tier === 'high') {
    likes = randomInt(12, Math.min(70, maxPossible));
    const dislikeUpper = Math.max(1, Math.floor(likes * 0.35));
    dislikes = randomInt(0, Math.min(dislikeUpper, maxPossible - likes));
  } else if (tier === 'medium') {
    likes = randomInt(4, Math.min(24, maxPossible));
    const dislikeUpper = Math.max(1, Math.floor(likes * 0.45));
    dislikes = randomInt(0, Math.min(dislikeUpper, maxPossible - likes));
  } else {
    likes = randomInt(0, Math.min(8, maxPossible));
    const dislikeUpper = Math.max(1, Math.floor(likes * 0.6));
    dislikes = randomInt(0, Math.min(dislikeUpper, maxPossible - likes));
  }

  return {
    likes,
    dislikes
  };
};

export const seedInteractions = async ({ users, postContexts }) => {
  const docs = [];
  const countsByPost = new Map();

  for (const postContext of postContexts) {
    const { post, authorId, engagementTier } = postContext;
    const availableUsers = users.filter(
      (user) => user._id.toString() !== authorId.toString()
    );

    const maxPossible = availableUsers.length;
    const { likes, dislikes } = getInteractionSplitByTier(engagementTier, maxPossible);

    const reactors = selectUniqueUsers(availableUsers, likes + dislikes);
    const likeReactors = reactors.slice(0, likes);
    const dislikeReactors = reactors.slice(likes, likes + dislikes);

    likeReactors.forEach((reactor) => {
      docs.push({
        userId: reactor._id,
        postId: post._id,
        type: 'like',
        createdAt: randomDateAfter(post.createdAt),
        updatedAt: randomDateAfter(post.createdAt)
      });
    });

    dislikeReactors.forEach((reactor) => {
      docs.push({
        userId: reactor._id,
        postId: post._id,
        type: 'dislike',
        createdAt: randomDateAfter(post.createdAt),
        updatedAt: randomDateAfter(post.createdAt)
      });
    });

    countsByPost.set(post._id.toString(), {
      likes: likeReactors.length,
      dislikes: dislikeReactors.length
    });
  }

  if (docs.length > 0) {
    await Interaction.insertMany(docs, { ordered: false });
  }

  const bulkOps = postContexts.map(({ post }) => {
    const counts = countsByPost.get(post._id.toString()) || { likes: 0, dislikes: 0 };

    return {
      updateOne: {
        filter: { _id: post._id },
        update: {
          $set: {
            likesCount: counts.likes,
            dislikesCount: counts.dislikes
          }
        }
      }
    };
  });

  if (bulkOps.length > 0) {
    await Post.bulkWrite(bulkOps);
  }

  return docs.length;
};
