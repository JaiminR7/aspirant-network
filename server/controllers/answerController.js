const User = require('../models/User');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const { createActivity } = require('./activityController');

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
    console.log('🔍 Getting answers for question:', req.params.questionId, 'exam:', req.examContext);
    const answers = await Answer.find({ question: req.params.questionId, exam: req.examContext })
      .populate('author').sort({ isAccepted: -1, createdAt: -1 });
    console.log('✅ Found answers:', answers.length);
    res.json({ success: true, data: answers });
  } catch (error) {
    console.error('❌ Error fetching answers:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, message: error.message });
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

    res.json({
      success: true,
      data: answers,
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
      data: {
        likesCount: updatedAnswer.upvotes,
        dislikesCount: updatedAnswer.downvotes,
        userVoteStatus
      }
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
      data: {
        likesCount: updatedAnswer.upvotes,
        dislikesCount: updatedAnswer.downvotes,
        userVoteStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createAnswer, getAnswersByQuestion, getAllAnswers, updateAnswer, deleteAnswer, markAccepted, upvoteAnswer, downvoteAnswer };
