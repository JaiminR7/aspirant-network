const mongoose = require('mongoose');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Interaction = require('../models/Interaction');
const Resource = require('../models/Resource');
const BannedEmail = require('../models/BannedEmail');
const Question = require('../models/Question');
const Story = require('../models/Story');
const Answer = require('../models/Answer');
const Activity = require('../models/Activity');
const SavedItem = require('../models/SavedItem');
const CirclePost = require('../models/CirclePost');
const ResourceRating = require('../models/ResourceRating');
const Circle = require('../models/Circle');

const parseLimit = (rawValue, fallback = 100, max = 500) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const [totalUsers, totalPosts, totalComments, typeBreakdownRaw, examBreakdownRaw, postsPerDayRaw] =
      await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Comment.countDocuments(),
        Post.aggregate([
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ]),
        Post.aggregate([
          {
            $match: {
              exam: { $in: ['CAT', 'GATE', 'UPSC'] }
            }
          },
          {
            $group: {
              _id: '$exam',
              count: { $sum: 1 }
            }
          }
        ]),
        Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ])
      ]);

    const postsByType = {
      question: 0,
      resource: 0,
      story: 0
    };

    typeBreakdownRaw.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(postsByType, item._id)) {
        postsByType[item._id] = item.count;
      }
    });

    const postsByExam = {
      CAT: 0,
      GATE: 0,
      UPSC: 0
    };

    examBreakdownRaw.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(postsByExam, item._id)) {
        postsByExam[item._id] = item.count;
      }
    });

    const postsPerDayMap = new Map(postsPerDayRaw.map((entry) => [entry._id, entry.count]));
    const postsPerDay = Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + index);
      const date = d.toISOString().slice(0, 10);
      return {
        date,
        count: postsPerDayMap.get(date) || 0
      };
    });

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalComments,
        postsByType,
        postsByExam,
        postsPerDay
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const { name, banned } = req.query;
    const limit = parseLimit(req.query.limit, 100, 500);
    const query = {};

    // Filter by ban status if specified
    if (banned !== undefined && banned !== null) {
      const isBanned = banned === 'true' || banned === true;
      query.isBanned = isBanned;
    }

    if (name && String(name).trim()) {
      const term = String(name).trim();
      const safePattern = { $regex: escapeRegex(term), $options: 'i' };
      query.$or = [
        { name: safePattern },
        { username: safePattern }
      ];
    }

    const users = await User.find(query)
      .select('name username email role isActive isBanned banReason bannedAt primaryExam examPreference level createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Ban user - permanently prevent user from accessing platform
 * User account remains but is marked as banned and inaccessible
 * Email is stored in banned list to prevent re-signup
 */
const banUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason = 'other', notes = '' } = req.body;
    const adminId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (id === adminId.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Admin cannot ban their own account' });
    }

    // Find user
    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isBanned) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'User is already banned' });
    }

    console.log(`[ADMIN_BAN] Admin ${adminId} is banning user ${id} (${user.username})`);

    // 1. Mark user as banned
    user.isBanned = true;
    user.banReason = reason;
    user.banNotes = notes;
    user.bannedAt = new Date();
    user.bannedBy = adminId;
    await user.save({ session });

    // 2. Store email in banned list to prevent re-signup
    const bannedEmail = await BannedEmail.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        email: user.email.toLowerCase(),
        userId: id,
        username: user.username,
        reason: 'banned_by_admin',
        adminNotes: notes,
        bannedAt: new Date(),
        bannedBy: adminId,
        permanent: true
      },
      { upsert: true, new: true, session }
    );

    console.log(`[ADMIN_BAN] Email ${user.email} added to banned list`);

    // 3. Revoke Clerk session access
    // Note: In production, call Clerk API to revoke all sessions
    // For now, marking as banned is sufficient - auth middleware checks isBanned

    await session.commitTransaction();
    console.log(`[ADMIN_BAN] ✓ User ${id} (${user.username}) permanently banned`);

    res.json({
      success: true,
      message: `User ${user.username} has been banned permanently`,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[ADMIN_BAN] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete user permanently - removes user and all owned content from database
 * Complete cascade deletion with cleanup
 */
const deleteUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (id === adminId.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Admin cannot delete their own account' });
    }

    // Find user to ensure they exist
    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`[ADMIN_DELETE_USER] Admin ${adminId} is deleting user ${id} (${user.username})`);

    // Define all cleanup tasks - same as user self-delete but for admin
    const cleanupTasks = [
      { name: 'Question', query: { createdBy: id }, description: 'Questions' },
      { name: 'Resource', query: { $or: [{ user: id }, { createdBy: id }] }, description: 'Resources' },
      { name: 'Story', query: { author: id }, description: 'Stories' },
      { name: 'Answer', query: { author: id }, description: 'Answers' },
      { name: 'Comment', query: { userId: id }, description: 'Comments' },
      { name: 'CirclePost', query: { author: id }, description: 'Circle posts' },
      { name: 'Activity', query: { $or: [{ user: id }, { actor: id }] }, description: 'Activities' },
      { name: 'Interaction', query: { userId: id }, description: 'Interactions' },
      { name: 'SavedItem', query: { userId: id }, description: 'Saved items' },
      { name: 'ResourceRating', query: { user: id }, description: 'Resource ratings' },
      { name: 'Post', query: { userId: id }, description: 'Posts' }
    ];

    const deletionStats = {};

    // Execute cleanup tasks with isolated error handling
    for (const task of cleanupTasks) {
      try {
        let Model;
        switch (task.name) {
          case 'Question': Model = Question; break;
          case 'Resource': Model = Resource; break;
          case 'Story': Model = Story; break;
          case 'Answer': Model = Answer; break;
          case 'Comment': Model = Comment; break;
          case 'CirclePost': Model = CirclePost; break;
          case 'Activity': Model = Activity; break;
          case 'Interaction': Model = Interaction; break;
          case 'SavedItem': Model = SavedItem; break;
          case 'ResourceRating': Model = ResourceRating; break;
          case 'Post': Model = Post; break;
          default: continue;
        }

        const result = await Model.deleteMany(task.query).session(session);
        deletionStats[task.name] = result.deletedCount || 0;
        console.log(`[ADMIN_DELETE_USER] Deleted ${deletionStats[task.name]} ${task.description}`);
      } catch (err) {
        console.error(`[ADMIN_DELETE_USER] Error deleting from ${task.name}: ${err.message}`);
        deletionStats[task.name] = `ERROR: ${err.message}`;
      }
    }

    // Remove user from other users' blocked lists
    try {
      const blockResult = await User.updateMany(
        { blockedUsers: id },
        { $pull: { blockedUsers: id } },
        { session }
      );
      console.log(`[ADMIN_DELETE_USER] Removed user from ${blockResult.modifiedCount || 0} block lists`);
    } catch (err) {
      console.error(`[ADMIN_DELETE_USER] Error removing from block lists: ${err.message}`);
    }

    // Remove user from circles
    try {
      const circleResult = await Circle.updateMany(
        { members: id },
        { $pull: { members: id } },
        { session }
      );
      console.log(`[ADMIN_DELETE_USER] Removed user from ${circleResult.modifiedCount || 0} circles`);
    } catch (err) {
      console.error(`[ADMIN_DELETE_USER] Error removing from circles: ${err.message}`);
    }

    // Remove user's votes from answers
    try {
      const upvoteResult = await Answer.updateMany(
        { upvotedBy: id },
        { $pull: { upvotedBy: id } },
        { session }
      );
      const downvoteResult = await Answer.updateMany(
        { downvotedBy: id },
        { $pull: { downvotedBy: id } },
        { session }
      );
      console.log(`[ADMIN_DELETE_USER] Removed votes from ${upvoteResult.modifiedCount + downvoteResult.modifiedCount} answers`);
    } catch (err) {
      console.error(`[ADMIN_DELETE_USER] Error removing votes: ${err.message}`);
    }

    // Finally delete the user account
    const deleteResult = await User.findByIdAndDelete(id, { session });
    if (!deleteResult) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user account'
      });
    }

    await session.commitTransaction();
    console.log(`[ADMIN_DELETE_USER] ✓ User ${id} (${user.username}) permanently deleted`);

    res.json({
      success: true,
      message: `User ${user.username} and all owned content have been permanently deleted`,
      stats: deletionStats
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[ADMIN_DELETE_USER] Fatal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
    });
  } finally {
    session.endSession();
  }
};

const getPosts = async (req, res) => {
  try {
    const { exam, type, username } = req.query;
    const limit = parseLimit(req.query.limit, 150, 500);

    const query = {};
    if (exam) query.exam = exam;
    if (type) query.type = type;
    if (username && String(username).trim()) {
      const normalizedUsername = String(username).trim().toLowerCase();
      const matchedUsers = await User.find({
        username: { $regex: escapeRegex(normalizedUsername), $options: 'i' }
      }).select('_id');

      if (matchedUsers.length === 0) {
        return res.json({ success: true, data: [] });
      }

      query.userId = { $in: matchedUsers.map((user) => user._id) };
    }

    const posts = await Post.find(query)
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const normalized = posts.map((post) => ({
      ...post,
      author: post.userId
    }));

    return res.json({ success: true, data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete post permanently - removes post and all related data
 */
const deletePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    // Find post to ensure it exists and get sourceModel info
    const post = await Post.findById(id).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    console.log(`[ADMIN_DELETE_POST] Deleting post ${id} (${post.sourceModel}:${post.sourceId})`);

    const deletionStats = {};

    // 1. Delete the post itself
    const postDeleteResult = await Post.findByIdAndDelete(id, { session });
    deletionStats.post = postDeleteResult ? 1 : 0;

    // 2. Delete comments on the post
    try {
      const commentResult = await Comment.deleteMany({ postId: id }, { session });
      deletionStats.comments = commentResult.deletedCount || 0;
      console.log(`[ADMIN_DELETE_POST] Deleted ${deletionStats.comments} comments`);
    } catch (err) {
      console.error(`[ADMIN_DELETE_POST] Error deleting comments: ${err.message}`);
      deletionStats.comments = `ERROR: ${err.message}`;
    }

    // 3. Delete interactions (likes/dislikes)
    try {
      const interactionResult = await Interaction.deleteMany({ postId: id }, { session });
      deletionStats.interactions = interactionResult.deletedCount || 0;
      console.log(`[ADMIN_DELETE_POST] Deleted ${deletionStats.interactions} interactions`);
    } catch (err) {
      console.error(`[ADMIN_DELETE_POST] Error deleting interactions: ${err.message}`);
      deletionStats.interactions = `ERROR: ${err.message}`;
    }

    // 4. Delete saved items (bookmarks)
    try {
      const savedResult = await SavedItem.deleteMany({ postId: id }, { session });
      deletionStats.savedItems = savedResult.deletedCount || 0;
      console.log(`[ADMIN_DELETE_POST] Deleted ${deletionStats.savedItems} saved items`);
    } catch (err) {
      console.error(`[ADMIN_DELETE_POST] Error deleting saved items: ${err.message}`);
      deletionStats.savedItems = `ERROR: ${err.message}`;
    }

    // 5. If it's a resource post, delete resource ratings
    if (post.sourceModel === 'Resource') {
      try {
        const ratingResult = await ResourceRating.deleteMany({ resource: post.sourceId }, { session });
        deletionStats.ratings = ratingResult.deletedCount || 0;
        console.log(`[ADMIN_DELETE_POST] Deleted ${deletionStats.ratings} resource ratings`);
      } catch (err) {
        console.error(`[ADMIN_DELETE_POST] Error deleting ratings: ${err.message}`);
        deletionStats.ratings = `ERROR: ${err.message}`;
      }
    }

    await session.commitTransaction();
    console.log(`[ADMIN_DELETE_POST] ✓ Post ${id} and all related data permanently deleted`);

    res.json({
      success: true,
      message: 'Post and all related data have been permanently deleted',
      stats: deletionStats
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[ADMIN_DELETE_POST] Fatal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete post'
    });
  } finally {
    session.endSession();
  }
};

const getReports = async (req, res) => {
  return res.json({
    success: true,
    data: [],
    message: 'Reports module is not integrated yet for this demo.'
  });
};

const forceDeleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource id' });
    }

    const deleted = await Resource.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    return res.json({ success: true, message: 'Resource force deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  banUser,
  deleteUser,
  getPosts,
  deletePost,
  getReports,
  forceDeleteResource
};
