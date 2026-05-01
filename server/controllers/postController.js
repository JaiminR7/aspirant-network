const Post = require('../models/Post');
const Interaction = require('../models/Interaction');
const SavedItem = require('../models/SavedItem');
const { applyInteractionContract, normalizeInteractionType } = require('../utils/interactionContract');

const ANONYMOUS_USER = {
  name: 'Anonymous',
  username: 'anonymous',
  profilePicture: null,
  avatar: null
};

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const applyAnonymousIdentity = (post) => {
  if (!post?.isAnonymous) return post;

  return {
    ...post,
    user: ANONYMOUS_USER,
    userId: ANONYMOUS_USER,
    author: ANONYMOUS_USER
  };
};

const enrichPostsWithInteraction = async (posts, userId) => {
  if (!posts.length) return [];

  const postIds = posts.map((p) => p._id);
  
  // Fetch interactions and saved status in parallel
  const [interactions, savedItems] = await Promise.all([
    Interaction.find({
      userId,
      postId: { $in: postIds }
    }).select('postId type').lean(),
    SavedItem.find({
      userId,
      postId: { $in: postIds }
    }).select('postId').lean()
  ]);

  const interactionMap = new Map(
    interactions.map((i) => [i.postId.toString(), i.type])
  );
  
  const savedSet = new Set(
    savedItems.map((s) => s.postId.toString())
  );

  return posts.map((post) => {
    const base = typeof post.toObject === 'function' ? post.toObject() : post;
    const userInteraction = normalizeInteractionType(interactionMap.get(base._id.toString()) || 'none');
    const isSaved = savedSet.has(base._id.toString());

    return applyAnonymousIdentity(applyInteractionContract({
      ...base,
      type: base.type || 'question',
      author: base.userId,
    }, {
      totalLikes: base.likesCount || 0,
      totalDislikes: base.dislikesCount || 0,
      totalComments: base.commentsCount || 0,
      interaction: userInteraction,
      isBookmarked: isSaved
    }));
  });
};

const getPosts = async (req, res) => {
  try {
    const { scope = 'my', exam, type = 'all', page = 1, limit = 20 } = req.query;
    const query = {};
    
    // 1. Sanitize Scope and Resolve Exam
    const sanitizedScope = ['my', 'all'].includes(scope) ? scope : 'my';
    
    if (sanitizedScope === 'my') {
      // Safely resolve exam from query param or authenticated user context
      const targetExam = exam || req.examContext || (req.user && req.user.primaryExam);
      if (targetExam) {
        query.exam = targetExam;
      }
    }

    // 2. Sanitize and Apply Type Filter
    if (type && typeof type === 'string' && type.toLowerCase() !== 'all') {
      const normalizedType = type.toLowerCase().trim().replace(/s$/, ''); // questions -> question
      const validTypes = ['question', 'resource', 'story'];
      
      if (validTypes.includes(normalizedType)) {
        query.type = normalizedType;
      }
    }

    const pageNum = parsePositiveInt(page, 1, 10000);
    const limitNum = parsePositiveInt(limit, 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const [total, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .populate('userId', 'name username profilePicture examPreference primaryExam')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    const enriched = await enrichPostsWithInteraction(posts, req.userId);

    return res.json({
      success: true,
      data: enriched,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'name username profilePicture examPreference primaryExam')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Parallelize engagement data fetching
    const [interaction, isSavedItem] = await Promise.all([
      Interaction.findOne({
        userId: req.userId,
        postId: post._id
      })
        .select('type')
        .lean(),
      SavedItem.findOne({
        userId: req.userId,
        postId: post._id
      })
        .select('_id')
        .lean()
    ]);

    const userInteraction = normalizeInteractionType(interaction?.type || 'none');

    return res.json({
      success: true,
      data: applyAnonymousIdentity(applyInteractionContract({
        ...post,
        type: post.type || 'question',
        author: post.userId
      }, {
        totalLikes: post.likesCount || 0,
        totalDislikes: post.dislikesCount || 0,
        totalComments: post.commentsCount || 0,
        interaction: userInteraction,
        isBookmarked: !!isSavedItem
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const savePost = async (req, res) => {
  try {
    // Try finding by direct ID or sourceId
    let post = await Post.findById(req.params.id);
    if (!post) {
      post = await Post.findOne({ sourceId: req.params.id });
    }

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const savedItem = await SavedItem.findOneAndUpdate(
      { userId: req.userId, postId: post._id },
      { userId: req.userId, postId: post._id, itemType: post.type || 'question' },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: savedItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const unsavePost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[unsave] Request to unsave ID: ${id} for user: ${req.userId}`);

    // Find the post first to get its hub ID
    let post = await Post.findById(id);
    if (!post) {
      post = await Post.findOne({ sourceId: id });
    }

    const postId = post ? post._id : id;
    console.log(`[unsave] Resolved Post Hub ID: ${postId}`);

    const result = await SavedItem.findOneAndDelete({
      userId: req.userId,
      postId
    });

    if (!result) {
      console.log(`[unsave] No saved item found for postId: ${postId}`);
    } else {
      console.log(`[unsave] Successfully removed saved item`);
    }

    return res.json({ 
      success: true, 
      message: 'Post removed from saved',
      removed: !!result
    });
  } catch (error) {
    console.error(`[unsave] Error:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { userId: req.userId };
    if (type && type !== 'all') {
      query.itemType = type;
    }

    const savedItems = await SavedItem.find(query)
      .sort({ savedAt: -1 })
      .populate({
        path: 'postId',
        populate: {
          path: 'userId',
          select: 'name username profilePicture primaryExam level'
        }
      });

    const posts = savedItems.map(item => item.postId).filter(p => !!p);
    const enriched = await enrichPostsWithInteraction(posts, req.userId);

    return res.json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPosts,
  getPostById,
  savePost,
  unsavePost,
  getSavedPosts
};
