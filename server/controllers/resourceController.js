const Resource = require('../models/Resource');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const User = require('../models/User');
const { 
  validateResourceMetadata, 
  validateRating,
  validateComment 
} = require('../utils/validators');
const {
  validateSystemTags,
  validateUserTags,
  validateAllTags
} = require('../utils/tagUtils');

// ==================== CREATE RESOURCE ====================

/**
 * @desc    Create a new resource
 * @route   POST /api/resources
 * @access  Protected
 */
const createResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      subject,
      topic,
      url,
      publicId,
      externalLink,
      systemTags,
      userTags
    } = req.body;

    // CRITICAL: Reject if exam is provided in body
    if (req.body.exam) {
      return res.status(403).json({
        success: false,
        message: 'Exam cannot be specified in request body. It is determined by your profile.'
      });
    }

    const exam = req.examContext;
    const userId = req.user._id;

    // Validate required fields
    if (!title || !description || !type || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, type, and subject are required'
      });
    }

    // Validate resource type
    const validTypes = ['PDF', 'Image', 'Link', 'Video'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid resource type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate content based on type
    if (type === 'Link' || type === 'Video') {
      if (!externalLink) {
        return res.status(400).json({
          success: false,
          message: `External link is required for ${type} resources`
        });
      }
      // Validate URL format
      try {
        new URL(externalLink);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format'
        });
      }
    } else if (type === 'PDF' || type === 'Image') {
      if (!url || !publicId) {
        return res.status(400).json({
          success: false,
          message: `URL and publicId are required for ${type} resources`
        });
      }
    }

    // Validate title and description length
    if (title.trim().length < 5 || title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 5 and 200 characters'
      });
    }

    if (description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 20 characters'
      });
    }

    // Validate tags
    const tagValidation = validateAllTags(systemTags, userTags, 'RESOURCE');
    if (!tagValidation.valid) {
      return res.status(400).json({
        success: false,
        message: tagValidation.error
      });
    }

    // Verify subject belongs to user's exam
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (subjectDoc.exam !== exam) {
      return res.status(403).json({
        success: false,
        message: `Subject does not belong to ${exam} exam`
      });
    }

    // Verify topic if provided
    let topicDoc = null;
    if (topic) {
      topicDoc = await Topic.findById(topic);
      if (!topicDoc) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      if (topicDoc.exam !== exam) {
        return res.status(403).json({
          success: false,
          message: `Topic does not belong to ${exam} exam`
        });
      }

      if (topicDoc.subject.toString() !== subject.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Topic does not belong to the specified subject'
        });
      }
    }

    // Create resource
    const resource = await Resource.create({
      title,
      description,
      type,
      author: userId,
      exam,
      subject,
      subjectName: subjectDoc.name,
      topic: topic || null,
      topicName: topicDoc ? topicDoc.name : null,
      url: url || null,
      publicId: publicId || null,
      externalLink: externalLink || null,
      systemTags: tagValidation.systemTags || [],
      userTags: tagValidation.userTags || []
    });

    await resource.populate([
      { path: 'author', select: 'username profilePicture credibilityScore' },
      { path: 'subject', select: 'name slug' },
      { path: 'topic', select: 'name slug' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resource
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET RESOURCES ====================

/**
 * @desc    Get all resources for user's exam with filters
 * @route   GET /api/resources
 * @access  Protected
 */
const getResources = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const {
      page = 1,
      limit = 20,
      type,
      subject,
      topic,
      verified,
      sortBy = '-createdAt',
      search
    } = req.query;

    // Build filter query
    const filter = { exam };

    if (type) filter.type = type;
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (verified === 'true') filter.isVerified = true;

    // Search in title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { userTags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate('author', 'username profilePicture credibilityScore')
        .populate('subject', 'name slug')
        .populate('topic', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResources: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET RESOURCE BY ID ====================

/**
 * @desc    Get single resource by ID
 * @route   GET /api/resources/:id
 * @access  Public (with optional auth for save/rate status)
 */
const getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user?._id;

    // Find resource and verify it belongs to user's exam
    const resource = await Resource.findOne({ _id: id, exam })
      .populate('author', 'username profilePicture credibilityScore')
      .populate('subject', 'name slug')
      .populate('topic', 'name slug')
      .populate('comments.author', 'username profilePicture');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found or does not belong to your exam'
      });
    }

    // Increment view count
    await resource.incrementViews();

    // Check if user has saved this resource
    let isSaved = false;
    let userRating = null;

    if (userId) {
      isSaved = resource.savedBy.some(id => id.toString() === userId.toString());
      
      // Find user's rating
      const ratingEntry = resource.ratings.find(r => r.user.toString() === userId.toString());
      if (ratingEntry) {
        userRating = ratingEntry.rating;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...resource.toObject(),
        isSaved,
        userRating
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RATE RESOURCE ====================

/**
 * @desc    Rate a resource (1-5 stars)
 * @route   PATCH /api/resources/:id/rate
 * @access  Protected
 */
const rateResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const exam = req.examContext;
    const userId = req.user._id;

    // Validate rating (must be 1-5)
    const ratingValidation = validateRating(rating);
    if (!ratingValidation.valid) {
      return res.status(400).json({
        success: false,
        message: ratingValidation.error
      });
    }

    // Find resource
    const resource = await Resource.findOne({ _id: id, exam });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Cannot rate own resource
    if (resource.author.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot rate your own resource'
      });
    }

    // Add or update rating (handles duplicates internally)
    await resource.addRating(userId, rating);

    res.status(200).json({
      success: true,
      message: 'Rating added successfully',
      data: {
        averageRating: resource.averageRating,
        ratingCount: resource.ratings.length,
        userRating: rating
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TOGGLE SAVE RESOURCE ====================

/**
 * @desc    Save/unsave resource to library
 * @route   POST /api/resources/:id/save
 * @access  Protected
 */
const toggleSaveResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find resource
    const resource = await Resource.findOne({ _id: id, exam });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check if already saved (prevent duplicates)
    const alreadySaved = resource.savedBy.some(
      savedUserId => savedUserId.toString() === userId.toString()
    );

    let action;
    if (alreadySaved) {
      // Unsave - remove from savedBy array
      resource.savedBy = resource.savedBy.filter(
        savedUserId => savedUserId.toString() !== userId.toString()
      );
      action = 'unsaved';
    } else {
      // Save - add to savedBy array
      await resource.toggleSave(userId);
      action = 'saved';
    }

    await resource.save();

    // Update user's savedResources array
    const user = await User.findById(userId);
    if (action === 'saved') {
      if (!user.savedResources.includes(id)) {
        user.savedResources.push(id);
      }
    } else {
      user.savedResources = user.savedResources.filter(
        resId => resId.toString() !== id.toString()
      );
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: `Resource ${action} successfully`,
      data: {
        isSaved: action === 'saved',
        saveCount: resource.savedBy.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET TOP RATED RESOURCES ====================

/**
 * @desc    Get top-rated resources for user's exam
 * @route   GET /api/resources/top-rated
 * @access  Protected
 */
const getTopRatedResources = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const { limit = 10 } = req.query;

    const resources = await Resource.getTopRated(exam, parseInt(limit));

    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET MOST SAVED RESOURCES ====================

/**
 * @desc    Get most saved resources for user's exam
 * @route   GET /api/resources/most-saved
 * @access  Protected
 */
const getMostSavedResources = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const { limit = 10 } = req.query;

    const resources = await Resource.getMostSaved(exam, parseInt(limit));

    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET VERIFIED RESOURCES ====================

/**
 * @desc    Get verified resources for user's exam
 * @route   GET /api/resources/verified
 * @access  Protected
 */
const getVerifiedResources = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.getVerified(exam)
        .skip(skip)
        .limit(parseInt(limit)),
      Resource.countDocuments({ exam, isVerified: true })
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET SAVED RESOURCES ====================

/**
 * @desc    Get user's saved resources
 * @route   GET /api/resources/saved
 * @access  Protected
 */
const getSavedResources = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Get user's saved resources
    const user = await User.findById(userId).select('savedResources');
    
    const [resources, total] = await Promise.all([
      Resource.find({ 
        _id: { $in: user.savedResources },
        exam 
      })
        .populate('author', 'username profilePicture credibilityScore')
        .populate('subject', 'name slug')
        .populate('topic', 'name slug')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments({ 
        _id: { $in: user.savedResources },
        exam 
      })
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE RESOURCE ====================

/**
 * @desc    Update resource
 * @route   PATCH /api/resources/:id
 * @access  Protected (owner only)
 */
const updateResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;
    const updates = req.body;

    // CRITICAL: Reject if exam, subject, author, or type is in body
    if (updates.exam || updates.subject || updates.author || updates.type) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change exam, subject, author, or resource type'
      });
    }

    // Find resource
    const resource = await Resource.findOne({ _id: id, exam });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check ownership
    if (resource.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own resources'
      });
    }

    // Validate no empty updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

    // Fields that can be updated
    const allowedUpdates = ['title', 'description', 'userTags', 'url', 'publicId', 'externalLink'];
    const updateKeys = Object.keys(updates);

    // Validate all keys are allowed
    const invalidKeys = updateKeys.filter(key => !allowedUpdates.includes(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidKeys.join(', ')}. Allowed fields: ${allowedUpdates.join(', ')}`
      });
    }

    // Validate title if provided
    if (updates.title && (updates.title.trim().length < 5 || updates.title.trim().length > 200)) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 5 and 200 characters'
      });
    }

    // Validate description if provided
    if (updates.description && updates.description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 20 characters'
      });
    }

    // Validate userTags if provided
    if (updates.userTags) {
      const tagValidation = validateUserTags(updates.userTags);
      if (!tagValidation.valid) {
        return res.status(400).json({
          success: false,
          message: tagValidation.error
        });
      }
      updates.userTags = tagValidation.tags;
    }

    // Apply updates
    updateKeys.forEach(key => {
      if (allowedUpdates.includes(key)) {
        resource[key] = updates[key];
      }
    });

    await resource.save();

    await resource.populate([
      { path: 'author', select: 'username profilePicture credibilityScore' },
      { path: 'subject', select: 'name slug' },
      { path: 'topic', select: 'name slug' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: resource
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE RESOURCE ====================

/**
 * @desc    Delete resource
 * @route   DELETE /api/resources/:id
 * @access  Protected (owner only)
 */
const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find resource
    const resource = await Resource.findOne({ _id: id, exam });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check ownership
    if (resource.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own resources'
      });
    }

    await resource.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADD COMMENT ====================

/**
 * @desc    Add a comment to a resource
 * @route   POST /api/resources/:id/comments
 * @access  Protected
 */
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const exam = req.examContext;
    const userId = req.user._id;

    // Validate content
    const commentValidation = validateComment(content);
    if (!commentValidation.valid) {
      return res.status(400).json({
        success: false,
        message: commentValidation.error
      });
    }

    // Find resource
    const resource = await Resource.findOne({ _id: id, exam });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Add comment
    await resource.addComment(userId, content);

    await resource.populate('comments.author', 'username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: resource.comments[resource.comments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE COMMENT ====================

/**
 * @desc    Delete a comment from a resource
 * @route   DELETE /api/resources/:id/comments/:commentId
 * @access  Protected (comment owner only)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find resource
    const resource = await Resource.findOne({ _id: id, exam });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Find comment
    const comment = resource.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Remove comment
    resource.comments.pull(commentId);
    await resource.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VERIFY RESOURCE ====================

/**
 * @desc    Verify a resource (admin only)
 * @route   PATCH /api/resources/:id/verify
 * @access  Protected (admin only)
 */
const verifyResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Check if user is admin (implement proper admin check based on your User model)
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can verify resources'
      });
    }

    // Find resource
    const resource = await Resource.findOne({ _id: id, exam });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Verify resource
    await resource.verify();

    res.status(200).json({
      success: true,
      message: 'Resource verified successfully',
      data: resource
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET USER RESOURCES ====================

/**
 * @desc    Get all resources by a specific user
 * @route   GET /api/resources/user/:userId
 * @access  Protected
 */
const getUserResources = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find({ author: userId, exam })
        .populate('subject', 'name slug')
        .populate('topic', 'name slug')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments({ author: userId, exam })
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET RESOURCES BY SUBJECT ====================

/**
 * @desc    Get resources by subject
 * @route   GET /api/resources/subject/:subjectId
 * @access  Protected
 */
const getResourcesBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20, sortBy = '-createdAt' } = req.query;

    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find({ subject: subjectId, exam })
        .populate('author', 'username profilePicture credibilityScore')
        .populate('topic', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments({ subject: subjectId, exam })
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET RESOURCES BY TOPIC ====================

/**
 * @desc    Get resources by topic
 * @route   GET /api/resources/topic/:topicId
 * @access  Protected
 */
const getResourcesByTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20, sortBy = '-createdAt' } = req.query;

    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find({ topic: topicId, exam })
        .populate('author', 'username profilePicture credibilityScore')
        .populate('subject', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments({ topic: topicId, exam })
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET RESOURCES BY TYPE ====================

/**
 * @desc    Get resources by type
 * @route   GET /api/resources/type/:type
 * @access  Protected
 */
const getResourcesByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20, sortBy = '-createdAt' } = req.query;

    // Validate type
    const validTypes = ['PDF', 'Image', 'Link', 'Video'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid resource type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find({ type, exam })
        .populate('author', 'username profilePicture credibilityScore')
        .populate('subject', 'name slug')
        .populate('topic', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments({ type, exam })
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResource,
  getResources,
  getResourceById,
  rateResource,
  toggleSaveResource,
  getTopRatedResources,
  getMostSavedResources,
  getVerifiedResources,
  getSavedResources,
  updateResource,
  deleteResource,
  addComment,
  deleteComment,
  verifyResource,
  getUserResources,
  getResourcesBySubject,
  getResourcesByTopic,
  getResourcesByType
};
