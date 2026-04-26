import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Comment from '../../models/Comment.js';
import Post from '../../models/Post.js';
import Resource from '../../models/Resource.js';
import Story from '../../models/Story.js';
import allowedCommentsModule from '../../constants/allowedComments.js';

const { COMMENT_MAP, RESOURCE_COMMENTS, STORY_COMMENTS, ALL_ALLOWED_COMMENT_TEXTS } = allowedCommentsModule;

dotenv.config();

const log = (message) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${message}`);
};

const recalculatePostCommentCounts = async () => {
  await Post.updateMany({}, { $set: { commentsCount: 0 } });

  const groupedCounts = await Comment.aggregate([
    { $group: { _id: '$postId', count: { $sum: 1 } } }
  ]);

  if (groupedCounts.length === 0) {
    return;
  }

  await Post.bulkWrite(
    groupedCounts.map((row) => ({
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { commentsCount: row.count } }
      }
    }))
  );
};

/**
 * Delete each comment where text is NOT in the allowed whitelist for that post.type.
 * We fetch post.type for each unique postId, then batch-delete invalid comments.
 */
const cleanupPostCommentsByType = async () => {
  // Get all post IDs that have comments
  const postIds = await Comment.distinct('postId');
  log(`Found ${postIds.length} unique postIds with comments.`);

  const posts = await Post.find({ _id: { $in: postIds } }).select('_id type').lean();
  const postTypeMap = new Map(posts.map((p) => [p._id.toString(), p.type]));

  let totalDeleted = 0;

  for (const [postIdStr, postType] of postTypeMap.entries()) {
    const allowedList = COMMENT_MAP[postType] || ALL_ALLOWED_COMMENT_TEXTS;
    const result = await Comment.deleteMany({
      postId: postIdStr,
      text: { $nin: allowedList }
    });
    if (result.deletedCount > 0) {
      log(`Post ${postIdStr} (type=${postType}): deleted ${result.deletedCount} invalid comments.`);
      totalDeleted += result.deletedCount;
    }
  }

  // Also delete orphaned comments (postId not found in posts collection)
  const orphaned = await Comment.deleteMany({ postId: { $nin: postIds } });
  if (orphaned.deletedCount > 0) {
    log(`Deleted ${orphaned.deletedCount} orphaned comments (no matching post).`);
    totalDeleted += orphaned.deletedCount;
  }

  return totalDeleted;
};

const cleanup = async () => {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(mongodbUri);
  log(`Connected to MongoDB: ${mongoose.connection.name}`);

  try {
    const [beforePostComments, beforeResources, beforeStories] = await Promise.all([
      Comment.countDocuments({}),
      Resource.countDocuments({}),
      Story.countDocuments({})
    ]);

    log(`Before cleanup — post comments: ${beforePostComments}, resources: ${beforeResources}, stories: ${beforeStories}`);

    // 1. Delete post comments that violate per-type whitelist
    const deletedPostComments = await cleanupPostCommentsByType();

    // 2. Clean inline resource comments (not in resource whitelist)
    const cleanedResources = await Resource.updateMany(
      {},
      { $pull: { comments: { content: { $nin: RESOURCE_COMMENTS } } } }
    );

    // 3. Clean inline story comments (not in story whitelist)
    const cleanedStories = await Story.updateMany(
      {},
      { $pull: { comments: { content: { $nin: STORY_COMMENTS } } } }
    );

    // 4. Recalculate resource comment counts
    await Resource.updateMany(
      {},
      [{ $set: { commentCount: { $size: '$comments' } } }],
      { updatePipeline: true }
    );

    // 5. Recalculate post comment counts
    await recalculatePostCommentCounts();

    const [afterPostComments, invalidResourceComments, invalidStoryComments] = await Promise.all([
      Comment.countDocuments({}),
      Resource.countDocuments({ comments: { $elemMatch: { content: { $nin: RESOURCE_COMMENTS } } } }),
      Story.countDocuments({ comments: { $elemMatch: { content: { $nin: STORY_COMMENTS } } } })
    ]);

    log(`Post comments deleted (type-aware): ${deletedPostComments}`);
    log(`Post comments after cleanup: ${afterPostComments}`);
    log(`Resources modified: ${cleanedResources.modifiedCount}`);
    log(`Stories modified: ${cleanedStories.modifiedCount}`);
    log(`Remaining invalid resource comments: ${invalidResourceComments}`);
    log(`Remaining invalid story comments: ${invalidStoryComments}`);
    log('Whitelist cleanup completed successfully.');
  } finally {
    await mongoose.disconnect();
    log('MongoDB connection closed.');
  }
};

cleanup().catch((error) => {
  console.error(error);
  process.exit(1);
});
