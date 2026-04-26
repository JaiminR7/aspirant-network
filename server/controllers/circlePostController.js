const mongoose = require('mongoose');
const Circle = require('../models/Circle');
const CirclePost = require('../models/CirclePost');

const ensurePostInExam = async (post, examContext) => {
  const circle = await Circle.findOne({ _id: post.circleId, exam: examContext }).select('_id');
  return Boolean(circle);
};

const createCirclePost = async (req, res) => {
  try {
    const { circleId, content, type = 'discussion' } = req.body;

    if (!circleId || !mongoose.Types.ObjectId.isValid(circleId)) {
      return res.status(400).json({ success: false, message: 'Valid circleId is required' });
    }

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const allowedTypes = ['question', 'resource', 'discussion'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid post type' });
    }

    const circle = await Circle.findOne({ _id: circleId, exam: req.examContext });
    if (!circle) {
      return res.status(404).json({ success: false, message: 'Circle not found' });
    }

    const isMember = circle.members.some((id) => id.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Join the circle before posting' });
    }

    const post = await CirclePost.create({
      circleId,
      author: req.userId,
      content: content.trim(),
      type,
    });

    await post.populate('author', 'name username profilePicture');

    res.status(201).json({
      success: true,
      data: {
        ...post.toObject(),
        likesCount: post.likesCount || post.likes.length,
        dislikesCount: post.dislikesCount || post.dislikes.length,
        userVoteStatus: 'none',
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getCirclePosts = async (req, res) => {
  try {
    const { circleId } = req.params;
    const { page = 1, limit = 20, sort = 'latest' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(circleId)) {
      return res.status(400).json({ success: false, message: 'Invalid circle ID' });
    }

    const circle = await Circle.findOne({ _id: circleId, exam: req.examContext }).lean();
    if (!circle) {
      return res.status(404).json({ success: false, message: 'Circle not found' });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortQuery =
      sort === 'most-liked'
        ? { likesCount: -1, commentsCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [total, posts] = await Promise.all([
      CirclePost.countDocuments({ circleId }),
      CirclePost.find({ circleId })
        .populate('author', 'name username profilePicture')
        .populate('comments.commentedBy', 'name username profilePicture')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const userIdStr = req.userId.toString();
    const data = posts.map((p) => ({
      ...p,
      likesCount: p.likesCount ?? p.likes?.length ?? 0,
      dislikesCount: p.dislikesCount ?? p.dislikes?.length ?? 0,
      commentsCount: p.commentsCount || p.comments?.length || 0,
      userVoteStatus: p.likes?.some((id) => id.toString() === userIdStr)
        ? 'upvoted'
        : p.dislikes?.some((id) => id.toString() === userIdStr)
        ? 'downvoted'
        : 'none',
      likes: undefined,
      dislikes: undefined,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCirclePost = async (req, res) => {
  try {
    const existingPost = await CirclePost.findById(req.params.id);
    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }

    const inExam = await ensurePostInExam(existingPost, req.examContext);
    if (!inExam) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }

    if (existingPost.author.toString() !== req.userId.toString()) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }

    const post = await CirclePost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upvoteCirclePost = async (req, res) => {
  try {
    const post = await CirclePost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const inExam = await ensurePostInExam(post, req.examContext);
    if (!inExam) return res.status(404).json({ success: false, message: 'Post not found' });

    const userIdStr = req.userId.toString();
    const hasUpvoted = post.likes.some((id) => id.toString() === userIdStr);

    let updated;
    if (hasUpvoted) {
      updated = await CirclePost.findByIdAndUpdate(
        req.params.id,
        { $pull: { likes: req.userId }, $set: { likesCount: Math.max((post.likesCount || post.likes.length || 0) - 1, 0) } },
        { new: true },
      );
    } else {
      const nextLikesCount = (post.likesCount || post.likes.length || 0) + 1;
      const nextDislikesCount = post.dislikes.some((id) => id.toString() === userIdStr)
        ? Math.max((post.dislikesCount || post.dislikes.length || 0) - 1, 0)
        : post.dislikesCount || post.dislikes.length || 0;

      updated = await CirclePost.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: { likes: req.userId },
          $pull: { dislikes: req.userId },
          $set: {
            likesCount: nextLikesCount,
            dislikesCount: nextDislikesCount,
          },
        },
        { new: true },
      );
    }

    const userVoteStatus = updated.likes.some((id) => id.toString() === userIdStr)
      ? 'upvoted'
      : updated.dislikes.some((id) => id.toString() === userIdStr)
      ? 'downvoted'
      : 'none';

    res.json({
      success: true,
      data: {
        likesCount: updated.likesCount ?? updated.likes.length,
        dislikesCount: updated.dislikesCount ?? updated.dislikes.length,
        commentsCount: updated.commentsCount || updated.comments.length || 0,
        userVoteStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downvoteCirclePost = async (req, res) => {
  try {
    const post = await CirclePost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const inExam = await ensurePostInExam(post, req.examContext);
    if (!inExam) return res.status(404).json({ success: false, message: 'Post not found' });

    const userIdStr = req.userId.toString();
    const hasDownvoted = post.dislikes.some((id) => id.toString() === userIdStr);

    let updated;
    if (hasDownvoted) {
      updated = await CirclePost.findByIdAndUpdate(
        req.params.id,
        { $pull: { dislikes: req.userId }, $set: { dislikesCount: Math.max((post.dislikesCount || post.dislikes.length || 0) - 1, 0) } },
        { new: true },
      );
    } else {
      const nextDislikesCount = (post.dislikesCount || post.dislikes.length || 0) + 1;
      const nextLikesCount = post.likes.some((id) => id.toString() === userIdStr)
        ? Math.max((post.likesCount || post.likes.length || 0) - 1, 0)
        : post.likesCount || post.likes.length || 0;

      updated = await CirclePost.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: { dislikes: req.userId },
          $pull: { likes: req.userId },
          $set: {
            dislikesCount: nextDislikesCount,
            likesCount: nextLikesCount,
          },
        },
        { new: true },
      );
    }

    const userVoteStatus = updated.likes.some((id) => id.toString() === userIdStr)
      ? 'upvoted'
      : updated.dislikes.some((id) => id.toString() === userIdStr)
      ? 'downvoted'
      : 'none';

    res.json({
      success: true,
      data: {
        likesCount: updated.likesCount ?? updated.likes.length,
        dislikesCount: updated.dislikesCount ?? updated.dislikes.length,
        commentsCount: updated.commentsCount || updated.comments.length || 0,
        userVoteStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addCommentToCirclePost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const post = await CirclePost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const inExam = await ensurePostInExam(post, req.examContext);
    if (!inExam) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.comments.push({ commentedBy: req.userId, content: content.trim() });
    post.commentsCount = post.comments.length;
    await post.save();

    const updated = await CirclePost.findById(req.params.id)
      .populate('comments.commentedBy', 'name username profilePicture')
      .lean();

    res.json({
      success: true,
      data: {
        comments: updated.comments || [],
        commentsCount: updated.commentsCount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCirclePost,
  getCirclePosts,
  deleteCirclePost,
  upvoteCirclePost,
  downvoteCirclePost,
  addCommentToCirclePost,
};
