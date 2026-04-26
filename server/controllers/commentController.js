const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

const MAX_COMMENTS_PER_POST = 10;
const MAX_COMMENT_LENGTH = 300;

/**
 * Safely map a populated comment to a guaranteed-valid shape.
 * Returns null if userId is missing or malformed — caller must filter nulls.
 */
const getCommentWithUserShape = (comment) => {
  const user = comment?.userId;
  if (!user || typeof user !== 'object' || !user._id || !user.name) {
    console.error('[comments] skipping comment with missing populated userId', {
      commentId: comment?._id || null,
      postId: comment?.postId || null
    });
    return null;
  }

  return {
    ...comment,
    userId: {
      _id: user._id,
      name: user.name,
      // User model stores profilePicture: { url, publicId } — no top-level 'avatar'
      avatar: user.profilePicture?.url || user.avatar || null
    }
  };
};

const addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Valid postId is required' });
    }

    // Basic free-text validation — no whitelist enforcement at runtime
    const trimmedText = typeof text === 'string' ? text.trim() : '';
    if (!trimmedText || trimmedText.length < 2) {
      return res.status(400).json({ success: false, message: 'Comment must be at least 2 characters' });
    }
    if (trimmedText.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`
      });
    }

    const post = await Post.findById(postId).select('_id').lean();
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const [commentsCount, existingUserComment] = await Promise.all([
      Comment.countDocuments({ postId }),
      Comment.findOne({ postId, userId: req.userId }).select('_id').lean()
    ]);

    if (commentsCount >= MAX_COMMENTS_PER_POST) {
      return res.status(400).json({
        success: false,
        message: `A post can have at most ${MAX_COMMENTS_PER_POST} comments.`
      });
    }

    if (existingUserComment) {
      return res.status(409).json({ success: false, message: 'You have already commented on this post.' });
    }

    const comment = await Comment.create({
      postId,
      userId: req.userId,
      text: trimmedText
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name profilePicture')
      .lean();

    const mappedComment = getCommentWithUserShape(populatedComment);
    if (!mappedComment) {
      return res.status(500).json({ success: false, message: 'Comment saved but user mapping failed.' });
    }

    const updatedCommentsCount = commentsCount + 1;
    await Post.findByIdAndUpdate(postId, { $set: { commentsCount: updatedCommentsCount } });

    return res.status(201).json({
      success: true,
      data: {
        comment: mappedComment,
        commentsCount: updatedCommentsCount
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      const keyPattern = error?.keyPattern || {};
      if (keyPattern.postId && keyPattern.userId) {
        return res.status(409).json({
          success: false,
          message: 'You have already commented on this post.'
        });
      }
      return res.status(409).json({ success: false, message: 'Conflict: duplicate comment.' });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Valid postId is required' });
    }

    // Parallelize existence check and comments fetching
    const [postExists, comments] = await Promise.all([
      Post.exists({ _id: postId }),
      Comment.find({ postId })
        .populate('userId', 'name profilePicture')
        .sort({ createdAt: 1 })
        .limit(MAX_COMMENTS_PER_POST)
        .lean()
    ]);

    if (!postExists) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const safeComments = comments
      .map(getCommentWithUserShape)
      .filter((comment) => Boolean(comment));

    return res.json({
      success: true,
      data: safeComments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addComment,
  getCommentsByPost
};
