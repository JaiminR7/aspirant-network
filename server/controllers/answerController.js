const mongoose = require('mongoose');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const { createActivity } = require('./activityController');
const { applyInteractionContract, normalizeInteractionType } = require('../utils/interactionContract');

const createAnswer = async (req, res) => {
  try {
    const { content, images, isAnonymous } = req.body;
    const question = await Question.findOne({ _id: req.params.questionId, exam: req.examContext });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const answer = await Answer.create({
      content, images, exam: req.examContext, question: req.params.questionId,
      author: isAnonymous ? null : req.userId, isAnonymous
    });
    await answer.populate('author question');

    // Increment answer count atomically
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.questionId,
      { $inc: { answerCount: 1 } },
      { new: true }
    );

    // Create activity for question owner if not anonymous and not the owner answering their own question
    if (!isAnonymous && question.createdBy && question.createdBy.toString() !== req.userId) {
      await createActivity({
        user: question.createdBy,
        type: 'answer',
        actor: req.userId,
        question: req.params.questionId,
        answer: answer._id,
        message: `answered your question: "${question.title}"`
      });
    }

    // Increment user's answer count
    if (req.userId && !isAnonymous) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { 'stats.answersGiven': 1 }
      });
    }

    res.status(201).json({ 
      success: true, 
      data: answer,
      commentsCount: updatedQuestion.answerCount || 0
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAnswersByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Validate questionId to prevent CastError 500
    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID' });
    }

    const answers = await Answer.find({ question: questionId, exam: req.examContext })
      .populate('author').sort({ isAccepted: -1, createdAt: -1 });
    const userId = req.userId?.toString();
    const payload = (answers || []).map((answerDoc) => {
      const answer = answerDoc.toObject ? answerDoc.toObject() : answerDoc;
      const interaction = userId
        ? (answer.upvotedBy || []).some((id) => id.toString() === userId)
          ? 'like'
          : (answer.downvotedBy || []).some((id) => id.toString() === userId)
            ? 'dislike'
            : 'none'
        : 'none';
      return applyInteractionContract(answer, {
        totalLikes: answer.upvotes || 0,
        totalDislikes: answer.downvotes || 0,
        totalComments: 0,
        interaction,
        isBookmarked: false
      });
    });
    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('[getAnswersByQuestion] Error:', error.message);
    res.json({ success: true, data: [], _warning: error.message });
  }
};

// Flat-route version: GET /api/answers/question/:questionId
// Restores original API contract for answerService.getAnswersByQuestion()
const getAnswersByQuestionDirect = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Validate questionId to avoid Mongoose CastError (which causes 500)
    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID' });
    }

    // NOTE: Do NOT filter by exam here — answers may have been seeded under a
    // different exam string than the user's current context. Scoping is done
    // at the question level, not the answer level, for this flat route.
    const answers = await Answer.find({ question: questionId })
      .populate('author', 'name username profilePicture credibilityScore')
      .sort({ isAccepted: -1, createdAt: -1 })
      .lean();

    // Attach userVoteStatus for the requesting user
    const userId = req.userId?.toString();
    const enriched = (answers || []).map(a => {
      const userVoteStatus = userId
        ? ((a.upvotedBy || []).some(id => id.toString() === userId) ? 'upvoted'
          : (a.downvotedBy || []).some(id => id.toString() === userId) ? 'downvoted'
          : 'none')
        : 'none';

      // Strip internal vote arrays from response to keep payload clean
      const { upvotedBy, downvotedBy, ...rest } = a;
      return applyInteractionContract({ ...rest }, {
        totalLikes: rest.upvotes || 0,
        totalDislikes: rest.downvotes || 0,
        totalComments: 0,
        interaction: normalizeInteractionType(userVoteStatus),
        isBookmarked: false
      });
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('[answers/question] Error:', error.message);
    // Return empty array instead of 500 — answers are secondary content
    res.json({ success: true, data: [], _warning: 'Failed to fetch answers' });
  }
};

const getAllAnswers = async (req, res) => {
  try {
    const { author, page = 1, limit = 10 } = req.query;
    // When filtering by author (profile page), skip exam context filter to avoid
    // ObjectId vs string mismatch
    const query = author ? { author } : { exam: req.examContext };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, answers] = await Promise.all([
      Answer.countDocuments(query),
      Answer.find(query)
        .populate('author question')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    const payload = (answers || []).map((answerDoc) => {
      const answer = answerDoc.toObject ? answerDoc.toObject() : answerDoc;
      const userId = req.userId?.toString();
      const interaction = userId
        ? (answer.upvotedBy || []).some((id) => id.toString() === userId)
          ? 'like'
          : (answer.downvotedBy || []).some((id) => id.toString() === userId)
            ? 'dislike'
            : 'none'
        : 'none';
      return applyInteractionContract(answer, {
        totalLikes: answer.upvotes || 0,
        totalDislikes: answer.downvotes || 0,
        totalComments: 0,
        interaction,
        isBookmarked: false
      });
    });

    res.json({
      success: true,
      data: payload,
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

const updateAnswer = async (req, res) => {
  try {
    const { content, images } = req.body;
    const answer = await Answer.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext, author: req.userId },
      { content, images },
      { new: true, runValidators: true }
    ).populate('author question');
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found or unauthorized' });
    res.json({ success: true, data: answer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteAnswer = async (req, res) => {
  try {
    // Only check ownership (author), not exam, to avoid ObjectId vs string mismatch
    const answer = await Answer.findOneAndDelete({ _id: req.params.id, author: req.userId });
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found or unauthorized' });

    // Decrement user's answer count
    if (req.userId && !answer.isAnonymous) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { 'stats.answersGiven': -1 }
      });
    }

    res.json({ success: true, message: 'Answer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAccepted = async (req, res) => {
  try {
    const answer = await Answer.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext },
      { isAccepted: true },
      { new: true }
    ).populate('author question');
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });
    await Question.findByIdAndUpdate(answer.question, { isSolved: true });
    res.json({ success: true, data: answer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const upvoteAnswer = async (req, res) => {
  try {
    // Support both direct (/api/answers/:id) and nested (/api/questions/:questionId/answers/:answerId) routes
    const answerId = req.params.answerId || req.params.id;
    
    const answer = await Answer.findOne({ _id: answerId, exam: req.examContext });
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

    const userId = req.userId;
    const alreadyUpvoted = answer.upvotedBy.some(id => id.toString() === userId.toString());
    const alreadyDownvoted = answer.downvotedBy.some(id => id.toString() === userId.toString());

    // Atomic operations
    if (alreadyUpvoted) {
      // Remove upvote
      await Answer.updateOne(
        { _id: answerId },
        { $pull: { upvotedBy: userId }, $inc: { upvotes: -1 } }
      );
    } else {
      // Add upvote, remove downvote if exists
      const update = { $addToSet: { upvotedBy: userId }, $inc: { upvotes: 1 } };
      if (alreadyDownvoted) {
        update.$pull = { downvotedBy: userId };
        update.$inc.downvotes = -1;
      }
      await Answer.updateOne({ _id: answerId }, update);
    }

    // Get updated answer
    const updatedAnswer = await Answer.findById(answerId);
    const userVoteStatus = updatedAnswer.upvotedBy.some(id => id.toString() === userId.toString())
      ? 'upvoted'
      : updatedAnswer.downvotedBy.some(id => id.toString() === userId.toString())
      ? 'downvoted'
      : 'none';

    res.json({
      success: true,
      data: applyInteractionContract({}, {
        totalLikes: updatedAnswer.upvotes,
        totalDislikes: updatedAnswer.downvotes,
        totalComments: 0,
        interaction: normalizeInteractionType(userVoteStatus),
        isBookmarked: false
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downvoteAnswer = async (req, res) => {
  try {
    // Support both direct (/api/answers/:id) and nested (/api/questions/:questionId/answers/:answerId) routes
    const answerId = req.params.answerId || req.params.id;
    
    const answer = await Answer.findOne({ _id: answerId, exam: req.examContext });
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

    const userId = req.userId;
    const alreadyUpvoted = answer.upvotedBy.some(id => id.toString() === userId.toString());
    const alreadyDownvoted = answer.downvotedBy.some(id => id.toString() === userId.toString());

    // Atomic operations
    if (alreadyDownvoted) {
      // Remove downvote
      await Answer.updateOne(
        { _id: answerId },
        { $pull: { downvotedBy: userId }, $inc: { downvotes: -1 } }
      );
    } else {
      // Add downvote, remove upvote if exists
      const update = { $addToSet: { downvotedBy: userId }, $inc: { downvotes: 1 } };
      if (alreadyUpvoted) {
        update.$pull = { upvotedBy: userId };
        update.$inc.upvotes = -1;
      }
      await Answer.updateOne({ _id: answerId }, update);
    }

    // Get updated answer
    const updatedAnswer = await Answer.findById(answerId);
    const userVoteStatus = updatedAnswer.upvotedBy.some(id => id.toString() === userId.toString())
      ? 'upvoted'
      : updatedAnswer.downvotedBy.some(id => id.toString() === userId.toString())
      ? 'downvoted'
      : 'none';

    res.json({
      success: true,
      data: applyInteractionContract({}, {
        totalLikes: updatedAnswer.upvotes,
        totalDislikes: updatedAnswer.downvotes,
        totalComments: 0,
        interaction: normalizeInteractionType(userVoteStatus),
        isBookmarked: false
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createAnswer, getAnswersByQuestion, getAnswersByQuestionDirect, getAllAnswers, updateAnswer, deleteAnswer, markAccepted, upvoteAnswer, downvoteAnswer };
