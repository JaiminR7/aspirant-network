const mongoose = require('mongoose');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Interaction = require('../models/Interaction');
const Resource = require('../models/Resource');

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
    const { name } = req.query;
    const limit = parseLimit(req.query.limit, 100, 500);
    const query = {};

    if (name && String(name).trim()) {
      const term = String(name).trim();
      const safePattern = { $regex: escapeRegex(term), $options: 'i' };
      query.$or = [
        { name: safePattern },
        { username: safePattern }
      ];
    }

    const users = await User.find(query)
      .select('name username email role isActive primaryExam examPreference level createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (id === req.userId.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot ban their own account' });
    }

    const desiredStatus = typeof isActive === 'boolean' ? isActive : false;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive: desiredStatus } },
      { new: true }
    ).select('name username isActive');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (id === req.userId.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete their own account' });
    }

    const user = await User.findById(id).select('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post id' });
    }

    const post = await Post.findById(id).select('_id');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await Promise.all([
      Post.findByIdAndDelete(id),
      Comment.deleteMany({ postId: id }),
      Interaction.deleteMany({ postId: id })
    ]);

    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
