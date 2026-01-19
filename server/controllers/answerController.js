const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const ChatRequest = require('../models/ChatRequest');
const { validateAnswerContent, validateComment } = require('../utils/validators');

// ==================== CREATE ANSWER ====================

/**
 * @desc    Create an answer to a question
 * @route   POST /api/questions/:questionId/answers
 * @access  Protected
 */
const createAnswer = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { content, images, isAnonymous } = req.body;

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
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Answer content is required'
      });
    }

    // Validate content
    const contentValidation = validateAnswerContent(content);
    if (!contentValidation.valid) {
      return res.status(400).json({
        success: false,
        message: contentValidation.error
      });
    }

    // Find question and verify it belongs to user's exam
    const question = await Question.findOne({ _id: questionId, exam });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or does not belong to your exam'
      });
    }

    // Check if question is already solved
    if (question.isSolved) {
      return res.status(400).json({
        success: false,
        message: 'This question is already marked as solved'
      });
    }

    // Create answer
    const answer = await Answer.create({
      content,
      author: isAnonymous ? null : userId,
      question: questionId,
      exam,
      images: images || [],
      isAnonymous: isAnonymous || false
    });

    // Populate author if not anonymous
    await answer.populate([
      { path: 'author', select: 'username profilePicture credibilityScore level' },
      { path: 'question', select: 'title exam' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Answer posted successfully',
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET ANSWERS BY QUESTION ====================

/**
 * @desc    Get all answers for a question
 * @route   GET /api/questions/:questionId/answers
 * @access  Public (with optional auth)
 */
const getAnswersByQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const exam = req.examContext;
    const userId = req.user?._id;
    const { sortBy = '-createdAt' } = req.query;

    // Verify question belongs to user's exam
    const question = await Question.findOne({ _id: questionId, exam });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or does not belong to your exam'
      });
    }

    // Get answers (accepted answer first, then sort by votes or date)
    const answers = await Answer.find({ question: questionId })
      .populate('author', 'username profilePicture credibilityScore level')
      .sort({ isAccepted: -1, ...parseSortBy(sortBy) })
      .lean();

    // Add user vote status if authenticated
    const answersWithVotes = answers.map(answer => ({
      ...answer,
      userVote: userId ? getUserVoteFromAnswer(answer, userId) : null
    }));

    res.status(200).json({
      success: true,
      data: answersWithVotes,
      count: answersWithVotes.length
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET ANSWER BY ID ====================

/**
 * @desc    Get single answer by ID
 * @route   GET /api/answers/:id
 * @access  Public (with optional auth)
 */
const getAnswerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user?._id;

    const answer = await Answer.findOne({ _id: id, exam })
      .populate('author', 'username profilePicture credibilityScore level')
      .populate('question', 'title exam author')
      .populate('comments.author', 'username profilePicture');

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found or does not belong to your exam'
      });
    }

    // Add user vote status
    const userVote = userId ? getUserVoteFromAnswer(answer.toObject(), userId) : null;

    res.status(200).json({
      success: true,
      data: {
        ...answer.toObject(),
        userVote
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VOTE ANSWER ====================

/**
 * @desc    Vote on an answer (upvote/downvote/remove)
 * @route   PATCH /api/answers/:id/vote
 * @access  Protected
 */
const voteAnswer = async (req, res, next) => {
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

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Cannot vote on own answer
    if (answer.author && answer.author.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot vote on your own answer'
      });
    }

    // Apply vote
    if (voteType === 'upvote') {
      await answer.addUpvote(userId);
    } else if (voteType === 'downvote') {
      await answer.addDownvote(userId);
    } else {
      // Remove vote
      answer.upvotes = answer.upvotes.filter(id => id.toString() !== userId.toString());
      answer.downvotes = answer.downvotes.filter(id => id.toString() !== userId.toString());
      await answer.save();
    }

    res.status(200).json({
      success: true,
      message: `Vote ${voteType === 'remove' ? 'removed' : 'recorded'} successfully`,
      data: {
        upvoteCount: answer.upvotes.length,
        downvoteCount: answer.downvotes.length,
        userVote: getUserVoteFromAnswer(answer.toObject(), userId)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ACCEPT ANSWER ====================

/**
 * @desc    Accept an answer as the solution (question owner only)
 * @route   PATCH /api/answers/:id/accept
 * @access  Protected (question owner only)
 */
const acceptAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam }).populate('question');

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Verify question exists and belongs to user's exam
    if (!answer.question) {
      return res.status(404).json({
        success: false,
        message: 'Associated question not found'
      });
    }

    if (answer.question.exam !== exam) {
      return res.status(403).json({
        success: false,
        message: 'Question does not belong to your exam'
      });
    }

    // Only question owner can accept answers
    if (!answer.question.author || answer.question.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the question owner can accept an answer'
      });
    }

    // Check if answer is already accepted
    if (answer.isAccepted) {
      return res.status(400).json({
        success: false,
        message: 'This answer is already accepted'
      });
    }

    // Check if question already has an accepted answer
    const existingAcceptedAnswer = await Answer.findOne({
      question: answer.question._id,
      isAccepted: true
    });

    if (existingAcceptedAnswer) {
      return res.status(400).json({
        success: false,
        message: 'This question already has an accepted answer. Unaccept it first.'
      });
    }

    // Mark answer as accepted
    await answer.markAccepted();

    // Update author's credibility score (if not anonymous)
    if (answer.author) {
      const author = await User.findById(answer.author);
      if (author) {
        await author.addCredibility(10, 'answer_accepted');
      }
    }

    await answer.populate('author', 'username profilePicture credibilityScore level');

    res.status(200).json({
      success: true,
      message: 'Answer accepted successfully',
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UNACCEPT ANSWER ====================

/**
 * @desc    Unaccept an answer (question owner only)
 * @route   PATCH /api/answers/:id/unaccept
 * @access  Protected (question owner only)
 */
const unacceptAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam }).populate('question');

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Only question owner can unaccept answers
    if (!answer.question.author || answer.question.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the question owner can unaccept an answer'
      });
    }

    // Check if answer is accepted
    if (!answer.isAccepted) {
      return res.status(400).json({
        success: false,
        message: 'This answer is not currently accepted'
      });
    }

    // Unmark as accepted
    await answer.unmarkAccepted();

    // Deduct credibility score (if not anonymous)
    if (answer.author) {
      const author = await User.findById(answer.author);
      if (author) {
        await author.addCredibility(-10, 'answer_unaccepted');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Answer unaccepted successfully',
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE ANSWER ====================

/**
 * @desc    Update answer
 * @route   PATCH /api/answers/:id
 * @access  Protected (owner only)
 */
const updateAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;
    const updates = req.body;

    // CRITICAL: Reject if exam, question, or author is in body
    if (updates.exam || updates.question || updates.author || updates.isAccepted) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change exam, question, author, or acceptance status'
      });
    }

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check ownership
    if (!answer.author || answer.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own answers'
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
    const allowedUpdates = ['content', 'images'];
    const updateKeys = Object.keys(updates);

    // Validate all keys are allowed
    const invalidKeys = updateKeys.filter(key => !allowedUpdates.includes(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidKeys.join(', ')}. Allowed fields: ${allowedUpdates.join(', ')}`
      });
    }

    // Validate content if provided
    if (updates.content) {
      const contentValidation = validateAnswerContent(updates.content);
      if (!contentValidation.valid) {
        return res.status(400).json({
          success: false,
          message: contentValidation.error
        });
      }
    }

    // Apply updates and add to edit history
    updateKeys.forEach(key => {
      if (allowedUpdates.includes(key)) {
        answer[key] = updates[key];
      }
    });

    // Add edit history entry
    answer.editHistory.push({
      editedAt: new Date(),
      previousContent: answer.content
    });

    await answer.save();

    await answer.populate('author', 'username profilePicture credibilityScore level');

    res.status(200).json({
      success: true,
      message: 'Answer updated successfully',
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE ANSWER ====================

/**
 * @desc    Delete answer
 * @route   DELETE /api/answers/:id
 * @access  Protected (owner only)
 */
const deleteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check ownership
    if (!answer.author || answer.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own answers'
      });
    }

    // Cannot delete accepted answer
    if (answer.isAccepted) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete an accepted answer. Ask the question owner to unaccept it first.'
      });
    }

    await answer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADD COMMENT ====================

/**
 * @desc    Add a comment to an answer
 * @route   POST /api/answers/:id/comments
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

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Add comment
    await answer.addComment(userId, content);

    await answer.populate('comments.author', 'username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: answer.comments[answer.comments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE COMMENT ====================

/**
 * @desc    Delete a comment from an answer
 * @route   DELETE /api/answers/:id/comments/:commentId
 * @access  Protected (comment owner only)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const exam = req.examContext;
    const userId = req.user._id;

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Find comment
    const comment = answer.comments.id(commentId);

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
    answer.comments.pull(commentId);
    await answer.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SEND CHAT REQUEST ====================

/**
 * @desc    Send chat request to answer author
 * @route   POST /api/answers/:id/chat-request
 * @access  Protected
 */
const sendChatRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const exam = req.examContext;
    const userId = req.user._id;

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters'
      });
    }

    // Find answer
    const answer = await Answer.findOne({ _id: id, exam }).populate('question');

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if answer is anonymous
    if (!answer.author) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send chat request to anonymous answer'
      });
    }

    // Cannot send request to yourself
    if (answer.author.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot send a chat request to yourself'
      });
    }

    // Check spam (max 5 pending requests)
    const canSend = await ChatRequest.canSendRequest(userId);
    if (!canSend) {
      return res.status(429).json({
        success: false,
        message: 'You have too many pending chat requests. Wait for responses before sending more.'
      });
    }

    // Create chat request
    const chatRequest = await ChatRequest.create({
      question: answer.question._id,
      answer: id,
      requester: userId,
      receiver: answer.author,
      message
    });

    // Add to answer's chatRequests array
    await answer.addChatRequest(chatRequest._id);

    await chatRequest.populate([
      { path: 'requester', select: 'username profilePicture credibilityScore' },
      { path: 'question', select: 'title' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Chat request sent successfully',
      data: chatRequest
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET USER ANSWERS ====================

/**
 * @desc    Get all answers by a specific user
 * @route   GET /api/answers/user/:userId
 * @access  Protected
 */
const getUserAnswers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const exam = req.examContext;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [answers, total] = await Promise.all([
      Answer.find({ author: userId, exam, isAnonymous: false })
        .populate('question', 'title exam')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Answer.countDocuments({ author: userId, exam, isAnonymous: false })
    ]);

    res.status(200).json({
      success: true,
      data: answers,
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse sortBy query parameter
 */
function parseSortBy(sortBy) {
  const sortOptions = {
    '-createdAt': { createdAt: -1 },
    'createdAt': { createdAt: 1 },
    '-votes': { upvotes: -1 },
    'votes': { upvotes: 1 }
  };
  return sortOptions[sortBy] || { createdAt: -1 };
}

/**
 * Get user's vote status from answer object
 */
function getUserVoteFromAnswer(answer, userId) {
  const userIdStr = userId.toString();
  if (answer.upvotes.some(id => id.toString() === userIdStr)) {
    return 'upvote';
  }
  if (answer.downvotes.some(id => id.toString() === userIdStr)) {
    return 'downvote';
  }
  return null;
}

module.exports = {
  createAnswer,
  getAnswersByQuestion,
  getAnswerById,
  voteAnswer,
  acceptAnswer,
  unacceptAnswer,
  updateAnswer,
  deleteAnswer,
  addComment,
  deleteComment,
  sendChatRequest,
  getUserAnswers
};
