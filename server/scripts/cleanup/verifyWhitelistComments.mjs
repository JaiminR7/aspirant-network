import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Comment from '../../models/Comment.js';
import Post from '../../models/Post.js';
import Resource from '../../models/Resource.js';
import Story from '../../models/Story.js';
import allowedCommentsModule from '../../constants/allowedComments.js';

const { COMMENT_MAP, RESOURCE_COMMENTS, STORY_COMMENTS } = allowedCommentsModule;

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // Verify post comments per type
  const postTypes = ['question', 'resource', 'story'];
  const typeResults = {};

  for (const type of postTypes) {
    const allowedList = COMMENT_MAP[type] || [];

    const postsOfType = await Post.find({ type }).select('_id').lean();
    const postIds = postsOfType.map((p) => p._id);

    const invalidCount = await Comment.countDocuments({
      postId: { $in: postIds },
      text: { $nin: allowedList }
    });

    typeResults[type] = { totalPosts: postIds.length, invalidComments: invalidCount };
  }

  // Comments with missing userId
  const missingUserPost = await Comment.countDocuments({
    $or: [{ userId: null }, { userId: { $exists: false } }]
  });

  // Resource and story inline comment violations
  const [invalidRes, invalidStory] = await Promise.all([
    Resource.countDocuments({ comments: { $elemMatch: { content: { $nin: RESOURCE_COMMENTS } } } }),
    Story.countDocuments({ comments: { $elemMatch: { content: { $nin: STORY_COMMENTS } } } })
  ]);

  console.log(
    JSON.stringify({
      byPostType: typeResults,
      missingUserPost,
      invalidRes,
      invalidStory
    }, null, 2)
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure in error path
  }
  process.exit(1);
});
