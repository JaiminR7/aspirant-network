const Question = require('../models/Question');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const { 
  validateUserTags, 
  validateQuestionMetadata,
  validateAll 
} = require('../utils/validators');
const { 
  validateSystemTags, 
  validateUserTags: validateUserTagsUtil, 
  validateAllTags,
  normalizeTags 
} = require('../utils/tagUtils');
const { EXAM_TYPES } = require('../constants/exams');

// ==================== CREATE QUESTION ====================

/**
 * @desc    Create a new question
 * @route   POST /api/questions
 * @access  Protected
 */
const createQuestion = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      subject, 
      topic, 
      difficulty,
      systemTags,
      userTags,
      images,
      isAnonymous 
    } = req.body;

    // CRITICAL: Reject if exam is provided in body (must come from context only)
    if (req.body.exam) {
      return res.status(403).json({
        success: false,
        message: 'Exam cannot be specified in request body. It is determined by your profile.'
      });
    }

    // Get exam from context (set by examContext middleware)
    const exam = req.examContext;
    const userId = req.user._id;

    // Validate required fields
    if (!title || !description || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, subject, and topic are required'
      });
    }

    // Validate title length
    if (title.trim().length < 10 || title.trim().length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 10 and 300 characters'
      });
    }

    // Validate description length
    if (description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 20 characters'
      });
    }

    // Validate both system and user tags
    const tagValidation = validateAllTags(systemTags, userTags, 'QUESTION');
    if (!tagValidation.valid) {
      return res.status(400).json({
        success: false,
        message: tagValidation.error
      });
    }

    // Validate question metadata
    const metadataValidation = validateQuestionMetadata({
      title,
      description,
      subject,
      topic,
      difficulty,
      systemTags,
      userTags
    });

    if (!metadataValidation.valid) {
      return res.status(400).json({
        success: false,
        message: metadataValidation.error
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

    // Verify topic belongs to same exam and subject
    const topicDoc = await Topic.findById(topic);
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

    // Create question with normalized tags
    const question = await Question.create({
      title,
      description,
      author: isAnonymous ? null : userId,
      exam,
      subject,
      subjectName: subjectDoc.name,
      topic,
      topicName: topicDoc.name,
      difficulty: difficulty || topicDoc.difficulty,
      systemTags: tagValidation.systemTags || [],
      userTags: tagValidation.userTags || [],
      images: images || [],
      isAnonymous: isAnonymous || false
    });

    // Populate author if not anonymous
    await question.populate([
      { path: 'author', select: 'username profilePicture credibilityScore level' },
      { path: 'subject', select: 'name slug' },
      { path: 'topic', select: 'name slug difficulty' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET QUESTIONS ====================

/**
 * @desc    Get all questions for user's exam with filters
 * @route   GET /api/questions
 * @access  Protected
 */
const getQuestions = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const {
      page = 1,
      limit = 20,
      subject,
      topic,
      difficulty,
      sortBy = '-createdAt',
      search,
      unanswered,
      solved,
      hasAcceptedAnswer
    } = req.query;

    // Build filter query
    const filter = { exam };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (unanswered === 'true') filter.answerCount = 0;
    if (solved === 'true') filter.isSolved = true;
    if (solved === 'false') filter.isSolved = false;
    if (hasAcceptedAnswer === 'true') filter.acceptedAnswer = { $ne: null };

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
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('author', 'username profilePicture credibilityScore level')
        .populate('subject', 'name slug')
        .populate('topic', 'name slug difficulty')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalQuestions: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET QUESTION BY ID ====================

/**
 * @desc    Get single question by ID
 * @route   GET /api/questions/:id
 * @access  Public (with optional auth for vote status)
 */
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user?._id;

    // Find question and verify it belongs to user's exam
    const question = await Question.findOne({ _id: id, exam })
      .populate('author', 'username profilePicture credibilityScore level')
      .populate('subject', 'name slug')
      .populate('topic', 'name slug difficulty')
      .populate('acceptedAnswer');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or does not belong to your exam'
      });
    }

    // Increment view count
    await question.incrementViews();

    // Get user's vote status if authenticated
    let userVote = null;
    if (userId) {
      userVote = question.getUserVote(userId);
    }

    res.status(200).json({
      success: true,
      data: {
        ...question.toObject(),
        userVote
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== MARK QUESTION SOLVED ====================

/**
 * @desc    Mark question as solved
 * @route   PATCH /api/questions/:id/solve
 * @access  Protected (owner only)
 */
const markQuestionSolved = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find question
    const question = await Question.findOne({ _id: id, exam });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check ownership (only author can mark as solved)
    if (!question.author || question.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the question author can mark it as solved'
      });
    }

    // Check if already solved
    if (question.isSolved) {
      return res.status(400).json({
        success: false,
        message: 'Question is already marked as solved'
      });
    }

    // Mark as solved
    await question.markSolved();

    res.status(200).json({
      success: true,
      message: 'Question marked as solved',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TRENDING QUESTIONS ====================

/**
 * @desc    Get trending questions for user's exam
 * @route   GET /api/questions/trending
 * @access  Protected
 */
const getTrendingQuestions = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const { limit = 10 } = req.query;

    const questions = await Question.getTrending(exam, parseInt(limit));

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UNANSWERED QUESTIONS ====================

/**
 * @desc    Get unanswered questions for user's exam
 * @route   GET /api/questions/unanswered
 * @access  Protected
 */
const getUnansweredQuestions = async (req, res, next) => {
  try {
    const exam = req.examContext;
    const { limit = 20 } = req.query;

    const questions = await Question.getUnanswered(exam, parseInt(limit));

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VOTE QUESTION ====================

/**
 * @desc    Vote on a question (upvote/downvote/remove)
 * @route   PATCH /api/questions/:id/vote
 * @access  Protected
 */
const voteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const exam = req.examContext;
    const userId = req.user._id;

    // Validate vote type
    if (!['upvote', 'downvote', 'remove'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type. Must be upvote, downvote, or remove'
      });
    }

    // Find question
    const question = await Question.findOne({ _id: id, exam });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Apply vote
    if (voteType === 'upvote') {
      await question.addUpvote(userId);
    } else if (voteType === 'downvote') {
      await question.addDownvote(userId);
    } else {
      // Remove vote
      question.upvotes = question.upvotes.filter(id => id.toString() !== userId.toString());
      question.downvotes = question.downvotes.filter(id => id.toString() !== userId.toString());
      await question.save();
    }

    res.status(200).json({
      success: true,
      message: `Vote ${voteType === 'remove' ? 'removed' : 'recorded'} successfully`,
      data: {
        upvoteCount: question.upvotes.length,
        downvoteCount: question.downvotes.length,
        userVote: question.getUserVote(userId)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE QUESTION ====================

/**
 * @desc    Update question
 * @route   PATCH /api/questions/:id
 * @access  Protected (owner only)
 */
const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;
    const updates = req.body;

    // CRITICAL: Reject if exam, subject, or topic is in body (cannot be changed)
    if (updates.exam || updates.subject || updates.topic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change exam, subject, or topic of a question'
      });
    }

    // Find question
    const question = await Question.findOne({ _id: id, exam });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check ownership
    if (!question.author || question.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own questions'
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
    const allowedUpdates = ['title', 'description', 'userTags', 'images'];
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
    if (updates.title && (updates.title.trim().length < 10 || updates.title.trim().length > 300)) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 10 and 300 characters'
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
      const tagValidation = validateUserTagsUtil(updates.userTags);
      if (!tagValidation.valid) {
        return res.status(400).json({
          success: false,
          message: tagValidation.error
        });
      }
      // Use normalized tags
      updates.userTags = tagValidation.tags;
    }

    // Apply updates
    updateKeys.forEach(key => {
      if (allowedUpdates.includes(key)) {
        question[key] = updates[key];
      }
    });

    await question.save();

    await question.populate([
      { path: 'author', select: 'username profilePicture credibilityScore level' },
      { path: 'subject', select: 'name slug' },
      { path: 'topic', select: 'name slug difficulty' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE QUESTION ====================

/**
 * @desc    Delete question
 * @route   DELETE /api/questions/:id
 * @access  Protected (owner only)
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find question
    const question = await Question.findOne({ _id: id, exam });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check ownership
    if (!question.author || question.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own questions'
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET USER QUESTIONS ====================

/**
 * @desc    Get all questions by a specific user
 * @route   GET /api/questions/user/:userId
 * @access  Protected
 */
const getUserQuestions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find({ author: userId, exam, isAnonymous: false })
        .populate('subject', 'name slug')
        .populate('topic', 'name slug difficulty')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments({ author: userId, exam, isAnonymous: false })
    ]);

    res.status(200).json({
      success: true,
      data: questions,
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

// ==================== GET QUESTIONS BY SUBJECT ====================

/**
 * @desc    Get questions by subject
 * @route   GET /api/questions/subject/:subjectId
 * @access  Protected
 */
const getQuestionsBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20, sortBy = '-createdAt' } = req.query;

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find({ subject: subjectId, exam })
        .populate('author', 'username profilePicture credibilityScore level')
        .populate('topic', 'name slug difficulty')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments({ subject: subjectId, exam })
    ]);

    res.status(200).json({
      success: true,
      data: questions,
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

// ==================== GET QUESTIONS BY TOPIC ====================

/**
 * @desc    Get questions by topic
 * @route   GET /api/questions/topic/:topicId
 * @access  Protected
 */
const getQuestionsByTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20, sortBy = '-createdAt' } = req.query;

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find({ topic: topicId, exam })
        .populate('author', 'username profilePicture credibilityScore level')
        .populate('subject', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments({ topic: topicId, exam })
    ]);

    res.status(200).json({
      success: true,
      data: questions,
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
  createQuestion,
  getQuestions,
  getQuestionById,
  markQuestionSolved,
  getTrendingQuestions,
  getUnansweredQuestions,
  voteQuestion,
  updateQuestion,
  deleteQuestion,
  getUserQuestions,
  getQuestionsBySubject,
  getQuestionsByTopic
};
