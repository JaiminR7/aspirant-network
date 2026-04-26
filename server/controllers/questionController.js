const User = require('../models/User');
const Question = require('../models/Question');
const Post = require('../models/Post');
const SavedItem = require('../models/SavedItem');
const { createActivity } = require('./activityController');

const createQuestion = async (req, res) => {
  try {
    console.log('📝 Creating question with data:', req.body);
    console.log('👤 User ID:', req.userId);
    console.log('📚 Exam Context:', req.examContext);
    
    const {
      title,
      description,
      subject,
      subjectName,
      topic,
      topicName,
      difficulty,
      systemTags,
      userTags,
      images,
      isAnonymous
    } = req.body;
    const normalizedIsAnonymous = Boolean(isAnonymous);
    
    const questionData = {
      title, 
      description, 
      subject, 
      subjectName, 
      topic, 
      topicName, 
      difficulty, 
      systemTags, 
      userTags, 
      images,
      exam: req.examContext, 
      createdBy: req.userId,
      isAnonymous: normalizedIsAnonymous
    };
    
    console.log('💾 Saving question to database:', questionData);
    const question = await Question.create(questionData);
    const feedPost = await Post.create({
      userId: req.userId,
      exam: req.examContext,
      type: 'question',
      sourceModel: 'Question',
      sourceId: question._id,
      title: question.title,
      description: question.description || '',
      tags: [
        ...(Array.isArray(question.systemTags) ? question.systemTags : []),
        ...(Array.isArray(question.userTags) ? question.userTags : [])
      ],
      isAnonymous: normalizedIsAnonymous
    });

    const populatedFeedPost = await Post.findById(feedPost._id)
      .populate('userId', 'name username profilePicture examPreference primaryExam')
      .lean();

    // Increment user's question count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.questionsPosted': 1 }
    });

    console.log('✅ Question created successfully:', question._id);
    
    await question.populate('subject topic createdBy');
    res.status(201).json({
      success: true,
      data: question,
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
    console.error('❌ Error creating question:', error.message);
    console.error('Stack:', error.stack);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const { subject, topic, difficulty, isSolved, createdBy, sortBy = 'recent', page = 1, limit = 10 } = req.query;
    // When filtering by owner (profile page), skip exam context filter to avoid
    // ObjectId vs string mismatch (req.examContext is a string like "CAT", DB stores ObjectId)
    const query = createdBy ? {} : { exam: req.examContext };
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (isSolved !== undefined) query.isSolved = isSolved === 'true';
    if (createdBy) query.createdBy = createdBy;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count and questions
    const [total, questions] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query)
        .populate('subject topic createdBy')
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    // Check for saved status if user is logged in
    let savedIds = new Set();
    if (req.userId) {
      const posts = await Post.find({ 
        sourceId: { $in: questions.map(q => q._id) },
        sourceModel: 'Question'
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

    // Apply trending logic if sortBy is trending
    let processedQuestions = questions;
    
    if (sortBy === 'trending') {
      const now = new Date();
      processedQuestions = questions.map(q => {
        const likesCount = q.upvotes?.length || 0;
        const dislikesCount = q.downvotes?.length || 0;
        const commentsCount = q.answerCount || 0;
        
        // Calculate score
        const score = (likesCount * 3) + (commentsCount * 4) - (dislikesCount * 2);
        
        // Apply time decay
        const hoursSincePost = (now - new Date(q.createdAt)) / 3600000;
        const trendingScore = score / Math.pow((hoursSincePost + 2), 1.5);
        
        return {
          ...q,
          likesCount,
          dislikesCount,
          commentsCount,
          trendingScore
        };
      });
      
      // Sort by trending score
      processedQuestions.sort((a, b) => b.trendingScore - a.trendingScore);
    } else if (sortBy.startsWith('-')) {
      // Handle MongoDB sort format
      const field = sortBy.substring(1);
      processedQuestions.sort((a, b) => {
        if (field === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
      });
    } else {
      // Default to recent
      processedQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Clean response: add counts and remove arrays
    const cleanedQuestions = processedQuestions.map(q => ({
      ...q,
      likesCount: q.upvotes?.length || 0,
      dislikesCount: q.downvotes?.length || 0,
      commentsCount: q.answerCount || 0,
      isSaved: savedIds.has(q._id.toString()),
      upvotes: undefined,
      downvotes: undefined
    }));
    
    res.json({ 
      success: true, 
      data: cleanedQuestions,
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

const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findOne(
      { _id: req.params.id, exam: req.examContext }
    ).populate('subject topic createdBy').lean();
    
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    // Add counts and determine user vote status
    const userId = req.userId?.toString();
    // Check for saved status
    let isSaved = false;
    if (req.userId) {
      const post = await Post.findOne({ sourceId: question._id, sourceModel: 'Question' }).select('_id');
      if (post) {
        const saved = await SavedItem.findOne({ userId: req.userId, postId: post._id }).select('_id');
        isSaved = !!saved;
      }
    }

    const cleanQuestion = {
      ...question,
      likesCount: question.upvotes?.length || 0,
      dislikesCount: question.downvotes?.length || 0,
      commentsCount: question.answerCount || 0,
      isSaved,
      userVoteStatus: question.upvotes?.some(id => id.toString() === userId) 
        ? 'upvoted'
        : question.downvotes?.some(id => id.toString() === userId)
        ? 'downvoted'
        : 'none',
      upvotes: undefined,
      downvotes: undefined
    };
    
    res.json({ success: true, data: cleanQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { title, description, difficulty, systemTags, userTags, images } = req.body;
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext, createdBy: req.userId },
      { title, description, difficulty, systemTags, userTags, images },
      { new: true, runValidators: true }
    ).populate('subject topic createdBy');
    if (!question) return res.status(404).json({ success: false, message: 'Question not found or unauthorized' });

    await Post.findOneAndUpdate(
      { sourceModel: 'Question', sourceId: question._id },
      {
        title: question.title,
        description: question.description || '',
        tags: [
          ...(Array.isArray(question.systemTags) ? question.systemTags : []),
          ...(Array.isArray(question.userTags) ? question.userTags : [])
        ]
      }
    );

    res.json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    // Only check ownership (createdBy), not exam, to avoid ObjectId vs string mismatch
    const question = await Question.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found or unauthorized' });

    await Post.deleteOne({ sourceModel: 'Question', sourceId: question._id });

    // Decrement user's question count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.questionsPosted': -1 }
    });

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markSolved = async (req, res) => {
  try {
    // Only check ownership, not exam context (avoids ObjectId vs string mismatch)
    const question = await Question.findOne(
      { _id: req.params.id, createdBy: req.userId }
    );
    
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found or unauthorized' });
    }

    // Toggle solved status
    question.isSolved = !question.isSolved;
    question.solvedAt = question.isSolved ? new Date() : null;
    await question.save();
    await question.populate('subject topic createdBy');

    res.json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const upvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({ _id: req.params.id, exam: req.examContext });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const userIdStr = req.userId.toString();
    const hasUpvoted = question.upvotes.some(id => id.toString() === userIdStr);
    const hasDownvoted = question.downvotes.some(id => id.toString() === userIdStr);

    let updatedQuestion;
    if (hasUpvoted) {
      // Toggle off upvote
      updatedQuestion = await Question.findByIdAndUpdate(
        req.params.id,
        { $pull: { upvotes: req.userId } },
        { new: true }
      );
    } else {
      // Add upvote and remove downvote if exists
      updatedQuestion = await Question.findByIdAndUpdate(
        req.params.id,
        { 
          $addToSet: { upvotes: req.userId },
          $pull: { downvotes: req.userId }
        },
        { new: true }
      );
    }

    const userVoteStatus = updatedQuestion.upvotes.some(id => id.toString() === userIdStr) 
      ? 'upvoted' 
      : updatedQuestion.downvotes.some(id => id.toString() === userIdStr) 
        ? 'downvoted' 
        : 'none';

    res.json({ 
      success: true, 
      data: { 
        likesCount: updatedQuestion.upvotes.length,
        dislikesCount: updatedQuestion.downvotes.length,
        commentsCount: updatedQuestion.answerCount || 0,
        userVoteStatus 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({ _id: req.params.id, exam: req.examContext });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const userIdStr = req.userId.toString();
    const hasDownvoted = question.downvotes.some(id => id.toString() === userIdStr);
    const hasUpvoted = question.upvotes.some(id => id.toString() === userIdStr);

    let updatedQuestion;
    if (hasDownvoted) {
      // Toggle off downvote
      updatedQuestion = await Question.findByIdAndUpdate(
        req.params.id,
        { $pull: { downvotes: req.userId } },
        { new: true }
      );
    } else {
      // Add downvote and remove upvote if exists
      updatedQuestion = await Question.findByIdAndUpdate(
        req.params.id,
        { 
          $addToSet: { downvotes: req.userId },
          $pull: { upvotes: req.userId }
        },
        { new: true }
      );
    }

    const userVoteStatus = updatedQuestion.upvotes.some(id => id.toString() === userIdStr) 
      ? 'upvoted' 
      : updatedQuestion.downvotes.some(id => id.toString() === userIdStr) 
        ? 'downvoted' 
        : 'none';

    res.json({ 
      success: true, 
      data: { 
        likesCount: updatedQuestion.upvotes.length,
        dislikesCount: updatedQuestion.downvotes.length,
        commentsCount: updatedQuestion.answerCount || 0,
        userVoteStatus 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrendingQuestions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const questions = await Question.find({ exam: req.examContext })
      .populate('subject topic createdBy')
      .lean();

    const now = new Date();
    const questionsWithScore = questions.map(q => {
      const likesCount = q.upvotes?.length || 0;
      const dislikesCount = q.downvotes?.length || 0;
      const commentsCount = q.answerCount || 0;
      
      // Trending formula: (likes * 3) + (comments * 4) - (dislikes * 2)
      const score = (likesCount * 3) + (commentsCount * 4) - (dislikesCount * 2);
      
      // Time decay
      const hoursSincePost = (now - new Date(q.createdAt)) / 3600000;
      const trendingScore = score / Math.pow((hoursSincePost + 2), 1.5);
      
      return { 
        ...q, 
        likesCount,
        dislikesCount,
        commentsCount,
        trendingScore,
        upvotes: undefined,
        downvotes: undefined
      };
    });

    questionsWithScore.sort((a, b) => b.trendingScore - a.trendingScore);
    const trending = questionsWithScore.slice(0, parseInt(limit));

    res.json({ success: true, data: trending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  createQuestion, 
  getAllQuestions, 
  getQuestionById, 
  updateQuestion, 
  deleteQuestion, 
  markSolved,
  upvoteQuestion,
  downvoteQuestion,
  getTrendingQuestions
};
