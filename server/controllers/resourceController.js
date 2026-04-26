const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const Post = require('../models/Post');
const User = require('../models/User');
const SavedItem = require('../models/SavedItem');
const ResourceRating = require('../models/ResourceRating');
const { cloudinary } = require('../middleware/upload');

// ─── Helper ──────────────────────────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const getOwnerId = (resource) => resource?.user || resource?.createdBy;
const isOwner = (resource, userId) => {
  const owner = getOwnerId(resource);
  if (!owner || !userId) return false;
  return owner.toString() === userId.toString();
};

const inferContentType = (resource) => {
  const schemaType = String(resource?.type || '').toLowerCase();
  const explicitType = String(resource?.content?.type || '').toLowerCase();
  const source = explicitType || schemaType;
  if (source.includes('pdf')) return 'pdf';
  if (source.includes('image')) return 'image';
  if (source.includes('video')) return 'video';
  if (source.includes('link')) return 'link';
  return source || 'file';
};

const sanitizeInlinePdfUrl = (url = '') => {
  if (!url) return '';
  return String(url)
    .replace(/\/fl_attachment(?=\/|,|$)/g, '')
    .replace(/[?&]fl_attachment=[^&]*/g, '')
    .replace(/([?&])attachment=[^&]*/g, '')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '');
};

const buildPdfViewerUrl = (content = {}) => {
  const publicId = content.publicId;
  let rawUrl = sanitizeInlinePdfUrl(content.url || '');

  // 1. If we have a direct URL, ensure it ends with .pdf
  if (rawUrl && rawUrl.includes('/raw/upload/')) {
    if (!rawUrl.toLowerCase().endsWith('.pdf')) {
      rawUrl = rawUrl.includes('?')
        ? rawUrl.replace('?', '.pdf?')
        : `${rawUrl}.pdf`;
    }
    return rawUrl;
  }

  // 2. If reconstructing from publicId, explicitly append .pdf if missing.
  // For 'raw' resource_type, Cloudinary needs the extension in the publicId
  // to resolve the file correctly.
  if (publicId) {
    const targetPublicId = publicId.toLowerCase().endsWith('.pdf')
      ? publicId
      : `${publicId}.pdf`;

    return cloudinary.url(targetPublicId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true
    });
  }

  return rawUrl;
};

const withViewerContent = (resource) => {
  const content = resource?.content || {};
  const contentType = inferContentType(resource);
  const normalizedUrl = sanitizeInlinePdfUrl(content.url || '');
  const viewerUrl =
    contentType === 'pdf'
      ? buildPdfViewerUrl(content)
      : normalizedUrl || content.externalLink || '';

  return {
    ...resource,
    content: {
      ...content,
      type: contentType,
      url: normalizedUrl || content.url || '',
      viewerUrl,
    },
  };
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
const createResource = async (req, res) => {
  try {
    const {
      title, description, type, subject, subjectName,
      topic, topicName, url, publicId, externalLink,
      systemTags, userTags, isAnonymous
    } = req.body;

    if (Boolean(isAnonymous)) {
      return res.status(400).json({ success: false, message: 'Resources cannot be posted anonymously' });
    }

    const content = {};
    if (url) content.url = sanitizeInlinePdfUrl(url);
    if (publicId) content.publicId = publicId;
    content.type = inferContentType({ type });
    if (externalLink) content.externalLink = externalLink;

    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to create resource' });
    }

    const resource = await Resource.create({
      title, description, type, subject, subjectName,
      topic, topicName, content,
      systemTags: systemTags || [],
      userTags: userTags || [],
      exam: req.examContext,
      user: req.userId,
      createdBy: req.userId
    });

    const feedPost = await Post.create({
      userId: req.userId,
      exam: req.examContext,
      type: 'resource',
      sourceModel: 'Resource',
      sourceId: resource._id,
      title: resource.title,
      description: resource.description || '',
      tags: [
        ...(Array.isArray(resource.systemTags) ? resource.systemTags : []),
        ...(Array.isArray(resource.userTags) ? resource.userTags : [])
      ],
      fileUrl: resource?.content?.url || null,
      fileType: resource.type === 'PDF' ? 'pdf' : null,
      isAnonymous: false
    });

    // Atomically increment user's resource count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.resourcesShared': 1 }
    });

    const populatedFeedPost = await Post.findById(feedPost._id)
      .populate('userId', 'name username profilePicture examPreference primaryExam')
      .lean();

    await resource.populate('subject topic createdBy');
    const normalizedResource = withViewerContent(resource.toObject());

    res.status(201).json({
      success: true,
      data: {
        ...normalizedResource,
        user: resource.user || resource.createdBy || null,
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        isSaved: false,
        userVoteStatus: 'none'
      },
      feedPost: {
        ...populatedFeedPost,
        author: populatedFeedPost?.userId,
        userInteraction: 'none',
        userVoteStatus: 'none'
      }
    });
  } catch (error) {
    console.error('CREATE RESOURCE ERROR:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────
const getAllResources = async (req, res) => {
  try {
    const { subject, topic, type, createdBy, uploadedBy, sortBy = 'recent', page = 1, limit = 10 } = req.query;
    const ownerFilter = createdBy || uploadedBy;

    const query = ownerFilter ? {} : { exam: req.examContext };
    if (subject && subject !== 'all') query.subject = subject;
    if (topic && topic !== 'all') query.topic = topic;
    if (type && type !== 'all') query.type = type;

    // Profile resources filter
    if (ownerFilter) {
      query.$or = [{ user: ownerFilter }, { createdBy: ownerFilter }];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = sortBy === 'popular' ? { 'rating.average': -1, downloadCount: -1 } : { createdAt: -1 };

    const [total, resources] = await Promise.all([
      Resource.countDocuments(query),
      Resource.find(query)
        .populate('subject topic createdBy')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    // Check for saved status if user is logged in
    let savedIds = new Set();
    if (req.userId) {
      const posts = await Post.find({
        sourceId: { $in: resources.map(r => r._id) },
        sourceModel: 'Resource'
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

    const cleanedResources = resources.map((r) => {
      const resourceWithViewer = withViewerContent(r);
      // Debug ownership integrity while fetching resources
      console.log('RESOURCE USER:', r.user || r.createdBy || null);
      return {
        ...resourceWithViewer,
        user: r.user || r.createdBy || null,
        likesCount: r.upvotes?.length || 0,
        dislikesCount: r.downvotes?.length || 0,
        commentsCount: r.commentCount || 0,
        isSaved: savedIds.has(r._id.toString()),
        upvotes: undefined,
        downvotes: undefined
      };
    });

    res.json({
      success: true,
      data: cleanedResources,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('GET RESOURCES ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getResourceById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }

    const resource = await Resource.findById(req.params.id)
      .populate('subject topic createdBy')
      .lean();

    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    console.log('RESOURCE USER:', resource.user || resource.createdBy || null);

    const userId = req.userId?.toString();
    // Check for saved status
    let isSaved = false;
    if (req.userId) {
      const post = await Post.findOne({ sourceId: resource._id, sourceModel: 'Resource' }).select('_id');
      if (post) {
        const saved = await SavedItem.findOne({ userId: req.userId, postId: post._id }).select('_id');
        isSaved = !!saved;
      }
    }

    const normalizedResource = withViewerContent(resource);
    const cleanResource = {
      ...normalizedResource,
      user: resource.user || resource.createdBy || null,
      likesCount: resource.upvotes?.length || 0,
      dislikesCount: resource.downvotes?.length || 0,
      commentsCount: resource.commentCount || 0,
      isSaved,
      userVoteStatus: resource.upvotes?.some(id => id.toString() === userId)
        ? 'upvoted'
        : resource.downvotes?.some(id => id.toString() === userId)
          ? 'downvoted'
          : 'none',
      upvotes: undefined,
      downvotes: undefined
    };

    res.json({ success: true, data: cleanResource });
  } catch (error) {
    console.error('GET RESOURCE BY ID ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
const updateResource = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }

    const { title, description, systemTags, userTags } = req.body;

    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    if (!isOwner(resource, req.userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this resource' });
    }

    const updated = await Resource.findByIdAndUpdate(
      req.params.id,
      { title, description, systemTags, userTags },
      { new: true, runValidators: true }
    ).populate('subject topic createdBy');

    await Post.findOneAndUpdate(
      { sourceModel: 'Resource', sourceId: resource._id },
      {
        title: updated.title,
        description: updated.description || '',
        tags: [
          ...(Array.isArray(updated.systemTags) ? updated.systemTags : []),
          ...(Array.isArray(updated.userTags) ? updated.userTags : [])
        ],
        isAnonymous: false
      }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('UPDATE RESOURCE ERROR:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE RESOURCE - ID:', id, '| USER:', req.userId);

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (!isOwner(resource, req.userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this resource' });
    }

    await Resource.findByIdAndDelete(id);
    await Post.deleteOne({ sourceModel: 'Resource', sourceId: resource._id });

    // Atomically decrement user's resource count (never below 0)
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.resourcesShared': -1 }
    });

    console.log('DELETE RESOURCE SUCCESS - ID:', id);
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('DELETE RESOURCE ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PREVIEW / DOWNLOAD / VOTING ──────────────────────────────────────────────
const previewResource = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    if (!resource.content?.url) return res.status(404).json({ success: false, message: 'File not found' });

    const normalized = withViewerContent(resource.toObject());
    res.redirect(normalized.content.viewerUrl || resource.content.url);
  } catch (error) {
    console.error('PREVIEW RESOURCE ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadResource = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const content = resource.content || {};
    let downloadUrl = content.url || '';

    if (content.publicId) {
      // Force 'raw' resource type for PDF downloads
      downloadUrl = cloudinary.url(content.publicId, {
        resource_type: 'raw',
        type: 'upload',
        flags: 'attachment',
        secure: true
      });
    } else if (downloadUrl) {
      // Fallback: manually add fl_attachment if missing
      if (!downloadUrl.includes('fl_attachment')) {
        downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
      }
    }

    if (!downloadUrl) return res.status(404).json({ success: false, message: 'File not found' });

    await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
    res.json({ success: true, downloadUrl });
  } catch (error) {
    console.error('DOWNLOAD RESOURCE ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTopRatedResources = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const resources = await Resource.find({ exam: req.examContext })
      .populate('subject topic createdBy')
      .sort({ 'rating.average': -1, downloadCount: -1 })
      .limit(limit);
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upvoteResource = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const userIdStr = req.userId.toString();
    const hasUpvoted = resource.upvotes.some(id => id.toString() === userIdStr);

    let updatedResource;
    if (hasUpvoted) {
      updatedResource = await Resource.findByIdAndUpdate(req.params.id, { $pull: { upvotes: req.userId } }, { new: true });
    } else {
      updatedResource = await Resource.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { upvotes: req.userId }, $pull: { downvotes: req.userId } },
        { new: true }
      );
    }

    const userVoteStatus = updatedResource.upvotes.some(id => id.toString() === userIdStr) ? 'upvoted'
      : updatedResource.downvotes.some(id => id.toString() === userIdStr) ? 'downvoted' : 'none';

    res.json({ success: true, data: { likesCount: updatedResource.upvotes.length, dislikesCount: updatedResource.downvotes.length, commentsCount: updatedResource.commentCount || 0, userVoteStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downvoteResource = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    const userIdStr = req.userId.toString();
    const hasDownvoted = resource.downvotes.some(id => id.toString() === userIdStr);

    let updatedResource;
    if (hasDownvoted) {
      updatedResource = await Resource.findByIdAndUpdate(req.params.id, { $pull: { downvotes: req.userId } }, { new: true });
    } else {
      updatedResource = await Resource.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { downvotes: req.userId }, $pull: { upvotes: req.userId } },
        { new: true }
      );
    }

    const userVoteStatus = updatedResource.upvotes.some(id => id.toString() === userIdStr) ? 'upvoted'
      : updatedResource.downvotes.some(id => id.toString() === userIdStr) ? 'downvoted' : 'none';

    res.json({ success: true, data: { likesCount: updatedResource.upvotes.length, dislikesCount: updatedResource.downvotes.length, commentsCount: updatedResource.commentCount || 0, userVoteStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrendingResources = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const resources = await Resource.find({ exam: req.examContext }).populate('subject topic createdBy').lean();
    const now = new Date();
    const scored = resources.map(r => {
      const hours = (now - new Date(r.createdAt)) / (1000 * 60 * 60);
      const score = (r.upvotes.length * 2) - r.downvotes.length + r.commentCount;
      return { ...r, trendingScore: score / (hours + 2) };
    });
    scored.sort((a, b) => b.trendingScore - a.trendingScore);
    res.json({ success: true, data: scored.slice(0, parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Create or update user's rating
    await ResourceRating.findOneAndUpdate(
      { user: userId, resource: id },
      { rating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recalculate aggregate rating for the resource
    const stats = await ResourceRating.aggregate([
      { $match: { resource: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$resource',
          averageRating: { $avg: '$rating' },
          ratingCount: { $count: {} },
          totalRating: { $sum: '$rating' }
        }
      }
    ]);

    let updateData = {
      'rating.average': 0,
      'rating.count': 0,
      'rating.total': 0
    };

    if (stats.length > 0) {
      const { averageRating, ratingCount, totalRating } = stats[0];
      updateData = {
        'rating.average': Number(averageRating.toFixed(1)),
        'rating.count': ratingCount,
        'rating.total': totalRating
      };
    }
    
    await Resource.findByIdAndUpdate(id, updateData);

    res.json({
      success: true,
      data: {
        averageRating: updateData['rating.average'],
        ratingCount: updateData['rating.count'],
        userRating: rating
      }
    });
  } catch (error) {
    console.error('RATE RESOURCE ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserResourceRating = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const resource = await Resource.findById(id).select('rating');
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    let userRating = 0;
    if (userId) {
      const ratingDoc = await ResourceRating.findOne({ user: userId, resource: id });
      userRating = ratingDoc ? ratingDoc.rating : 0;
    }

    res.json({
      success: true,
      data: {
        averageRating: resource.rating?.average || 0,
        ratingCount: resource.rating?.count || 0,
        userRating
      }
    });
  } catch (error) {
    console.error('GET USER RATING ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createResource, getAllResources, getResourceById, updateResource,
  deleteResource, previewResource, downloadResource,
  getTopRatedResources, upvoteResource, downvoteResource, getTrendingResources,
  rateResource, getUserResourceRating
};
