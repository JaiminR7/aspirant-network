const Story = require('../models/Story');
const Post = require('../models/Post');
const SavedItem = require('../models/SavedItem');
const Interaction = require('../models/Interaction');
const { applyInteractionContract, normalizeInteractionType } = require('../utils/interactionContract');

const getAllStories = async (req, res) => {
  try {
    const { type, sortBy = '-createdAt', page = 1, limit = 12, author } = req.query;
    // When filtering by author (profile page), skip exam context filter to avoid
    // ObjectId vs string mismatch
    const query = author ? {} : { exam: req.examContext };
    if (type && type !== 'all') query.storyType = type;
    if (author) query.author = author;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sort = sortBy === 'popular'
      ? { likesCount: -1, createdAt: -1 }
      : { createdAt: -1 };

    const [total, stories] = await Promise.all([
      Story.countDocuments(query),
      Story.find(query).populate('author').sort(sort).skip(skip).limit(limitNum).lean()
    ]);

    // Check for saved status if user is logged in
    let savedIds = new Set();
    if (req.userId) {
      const posts = await Post.find({ 
        sourceId: { $in: stories.map(s => s._id) },
        sourceModel: 'Story'
      }).select('_id sourceId');
      
      const postIds = posts.map(p => p._id);
      const savedItems = await SavedItem.find({
        userId: req.userId,
        postId: { $in: postIds }
      }).select('postId');
      
      const postIdToSourceId = new Map(posts.map(p => [p._id.toString(), p.sourceId.toString()]));
      savedItems.forEach(s => {
        const sourceId = postIdToSourceId.get(s.postId.toString());
        if (sourceId) savedIds.add(sourceId);
      });
    }

    const cleanedStories = stories.map(s => {
      const cleaned = applyInteractionContract({
        ...s,
        upvotes: undefined,
        downvotes: undefined
      }, {
        totalLikes: s.upvotes?.length || 0,
        totalDislikes: s.downvotes?.length || 0,
        totalComments: s.comments?.length || 0,
        interaction: 'none',
        isBookmarked: savedIds.has(s._id.toString())
      });

      if (s.isAnonymous) {
        cleaned.author = undefined;
      }

      return cleaned;
    });

    res.json({
      success: true,
      data: cleanedStories,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStoryById = async (req, res) => {
  try {
    const story = await Story.findOne(
      { _id: req.params.id, exam: req.examContext }
    ).populate('author')
     .populate({ path: 'comments.user', select: 'name username profilePicture' })
     .lean();
    
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    
    // Add counts and user vote status
    const userId = req.userId?.toString();
    const isOwnStory = story.author?._id?.toString() === userId;
    // Check for saved status and get hub postId
    let isSaved = false;
    let userInteraction = 'none';
    let likesCount = story.upvotes?.length || 0;
    let dislikesCount = story.downvotes?.length || 0;
    let postId = null;

    const postHub = await Post.findOne({ sourceId: story._id, sourceModel: 'Story' }).select('_id likesCount dislikesCount');
    
    if (postHub) {
      postId = postHub._id;
      likesCount = postHub.likesCount || 0;
      dislikesCount = postHub.dislikesCount || 0;

      if (req.userId) {
        const [saved, interaction] = await Promise.all([
          SavedItem.findOne({ userId: req.userId, postId: postHub._id }).select('_id'),
          Interaction.findOne({ userId: req.userId, postId: postHub._id }).select('type')
        ]);
        isSaved = !!saved;
        userInteraction = normalizeInteractionType(interaction?.type || 'none');
      }
    }

    const cleanStory = applyInteractionContract({
      ...story,
      postId, // Hub ID
      isOwnStory,
      upvotes: undefined,
      downvotes: undefined,
      savedBy: undefined,
    }, {
      totalLikes: likesCount,
      totalDislikes: dislikesCount,
      totalComments: story.comments?.length || 0,
      interaction: userInteraction,
      isBookmarked: isSaved
    });

    if (story.isAnonymous) {
      cleanStory.author = undefined;
    }
    
    res.json({ success: true, data: cleanStory });
  } catch (error) {
    if (
      error.message.includes('at most 10 comments') ||
      error.message.includes('already commented') ||
      error.message.includes('Duplicate comment text') ||
      error.message.includes('content is required')
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

const createStory = async (req, res) => {
  try {
    const {
      title,
      content,
      storyType,
      type,
      excerpt,
      tags,
      isAnonymous,
      result,
    } = req.body;
    const story = await Story.create({
      title,
      content,
      storyType: storyType || type,
      excerpt,
      tags,
      isAnonymous: Boolean(isAnonymous),
      result,
      exam: req.examContext,
      author: req.userId,
    });
    const feedPost = await Post.create({
      userId: req.userId,
      exam: req.examContext,
      type: 'story',
      sourceModel: 'Story',
      sourceId: story._id,
      title: story.title,
      description: story.excerpt || story.content || '',
      tags: Array.isArray(story.tags) ? story.tags : [],
      isAnonymous: Boolean(story.isAnonymous)
    });

    const populatedFeedPost = await Post.findById(feedPost._id)
      .populate('userId', 'name username profilePicture examPreference primaryExam')
      .lean();

    await story.populate('author');

    const payload = story.toObject();
    if (payload.isAnonymous) {
      payload.author = undefined;
    }

    res.status(201).json({
      success: true,
      data: payload,
      feedPost: {
        ...populatedFeedPost,
        author: populatedFeedPost?.isAnonymous
          ? {
              name: 'Anonymous',
              username: 'anonymous',
              profilePicture: null,
              avatar: null
            }
          : populatedFeedPost?.userId,
        userId: populatedFeedPost?.isAnonymous
          ? {
              name: 'Anonymous',
              username: 'anonymous',
              profilePicture: null,
              avatar: null
            }
          : populatedFeedPost?.userId,
        userInteraction: 'none',
        userVoteStatus: 'none'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateStory = async (req, res) => {
  try {
    const { title, content, storyType, type, excerpt, tags, isAnonymous, result } = req.body;

    const updateData = {
      title,
      content,
      storyType: storyType || type,
      excerpt,
      tags,
      result,
    };

    if (typeof isAnonymous === 'boolean') {
      updateData.isAnonymous = isAnonymous;
    }

    const story = await Story.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext, author: req.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('author');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found or unauthorized' });

    await Post.findOneAndUpdate(
      { sourceModel: 'Story', sourceId: story._id },
      {
        title: story.title,
        description: story.excerpt || story.content || '',
        tags: Array.isArray(story.tags) ? story.tags : [],
        isAnonymous: Boolean(story.isAnonymous)
      }
    );

    const payload = story.toObject();
    if (payload.isAnonymous) {
      payload.author = undefined;
    }

    res.json({ success: true, data: payload });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteStory = async (req, res) => {
  try {
    // Only check ownership (author), not exam, to avoid ObjectId vs string mismatch
    const story = await Story.findOneAndDelete({ _id: req.params.id, author: req.userId });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found or unauthorized' });

    await Post.deleteOne({ sourceModel: 'Story', sourceId: story._id });

    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upvoteStory = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, exam: req.examContext });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    await story.upvote(req.userId);

    const userIdStr = req.userId.toString();
    const userVoteStatus = story.upvotes.some(id => id.toString() === userIdStr) 
      ? 'upvoted' 
      : story.downvotes.some(id => id.toString() === userIdStr) 
        ? 'downvoted' 
        : 'none';

    res.json({
      success: true,
      data: applyInteractionContract({}, {
        totalLikes: story.upvotes.length,
        totalDislikes: story.downvotes.length,
        totalComments: story.comments?.length || 0,
        interaction: normalizeInteractionType(userVoteStatus),
        isBookmarked: false
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downvoteStory = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, exam: req.examContext });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    await story.downvote(req.userId);

    const userIdStr = req.userId.toString();
    const userVoteStatus = story.upvotes.some(id => id.toString() === userIdStr) 
      ? 'upvoted' 
      : story.downvotes.some(id => id.toString() === userIdStr) 
        ? 'downvoted' 
        : 'none';

    res.json({
      success: true,
      data: applyInteractionContract({}, {
        totalLikes: story.upvotes.length,
        totalDislikes: story.downvotes.length,
        totalComments: story.comments?.length || 0,
        interaction: normalizeInteractionType(userVoteStatus),
        isBookmarked: false
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrendingStories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const stories = await Story.find({ exam: req.examContext, status: 'Published' })
      .populate('author')
      .lean();

    const now = new Date();
    const storiesWithScore = stories.map(s => {
      const hoursSinceCreation = (now - new Date(s.createdAt)) / (1000 * 60 * 60);
      const upvotesCount = s.upvotes?.length || 0;
      const downvotesCount = s.downvotes?.length || 0;
      const commentsCount = s.comments?.length || 0;
      const score = (upvotesCount * 3) + (commentsCount * 4) - (downvotesCount * 2);
      const trendingScore = score / Math.pow((hoursSinceCreation + 2), 1.5);
      
      const cleaned = {
        ...s, 
        trendingScore,
        likesCount: upvotesCount,
        dislikesCount: downvotesCount,
        commentsCount,
        upvotes: undefined,
        downvotes: undefined
      };

      if (s.isAnonymous) {
        cleaned.author = undefined;
      }

      return cleaned;
    });

    storiesWithScore.sort((a, b) => b.trendingScore - a.trendingScore);
    const trending = storiesWithScore.slice(0, parseInt(limit));

    res.json({ success: true, data: trending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const saveStory = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, exam: req.examContext });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    await story.toggleSave(req.userId);

    const isSaved = story.savedBy.some(id => id.toString() === req.userId.toString());
    res.json({
      success: true,
      data: applyInteractionContract({}, {
        totalLikes: story.upvotes?.length || 0,
        totalDislikes: story.downvotes?.length || 0,
        totalComments: story.comments?.length || 0,
        interaction: 'none',
        isBookmarked: isSaved
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { content, isAnonymous = false } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment content is required' });

    const story = await Story.findOne({ _id: req.params.id, exam: req.examContext });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    await story.addComment(req.userId, content.trim(), isAnonymous);

    const updated = await Story.findById(req.params.id)
      .populate({ path: 'comments.user', select: 'name username profilePicture' })
      .lean();

    res.json({
      success: true,
      data: {
        comments: (updated.comments || []).map((comment) => applyInteractionContract({
          ...comment
        }, {
          totalLikes: 0,
          totalDislikes: 0,
          totalComments: 0,
          interaction: 'none',
          isBookmarked: false
        })),
        commentsCount: updated.comments?.length || 0,
        totalComments: updated.comments?.length || 0
      }
    });
  } catch (error) {
    if (
      error?.name === 'ValidationError' ||
      /comment content is required|at most 10 comments|already commented|duplicate comment text|approved whitelist/i.test(
        error?.message || ''
      )
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, exam: req.examContext });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    const comment = story.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const isAuthor = story.author.toString() === req.userId.toString();
    const isCommenter = comment.user.toString() === req.userId.toString();
    if (!isAuthor && !isCommenter) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.deleteOne();
    await story.save();

    const updated = await Story.findById(req.params.id)
      .populate({ path: 'comments.user', select: 'name username profilePicture' })
      .lean();

    res.json({
      success: true,
      data: {
        comments: (updated.comments || []).map((comment) => applyInteractionContract({
          ...comment
        }, {
          totalLikes: 0,
          totalDislikes: 0,
          totalComments: 0,
          interaction: 'none',
          isBookmarked: false
        })),
        commentsCount: updated.comments?.length || 0,
        totalComments: updated.comments?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getAllStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory,
  upvoteStory,
  downvoteStory,
  getTrendingStories,
  saveStory,
  addComment,
  deleteComment
};
