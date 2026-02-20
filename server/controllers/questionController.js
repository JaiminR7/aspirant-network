const Question = require('../models/Question');
const { createActivity } = require('./activityController');

const createQuestion = async (req, res) => {
  try {
    console.log('📝 Creating question with data:', req.body);
    console.log('👤 User ID:', req.userId);
    console.log('📚 Exam Context:', req.examContext);
    
    const { title, description, subject, subjectName, topic, topicName, difficulty, systemTags, userTags, images } = req.body;
    
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
      createdBy: req.userId
    };
    
    console.log('💾 Saving question to database:', questionData);
    const question = await Question.create(questionData);
    console.log('✅ Question created successfully:', question._id);
    
    await question.populate('subject topic createdBy');
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error('❌ Error creating question:', error.message);
    console.error('Stack:', error.stack);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    console.log('📋 Fetching all questions for exam:', req.examContext);
    console.log('📊 Query params:', req.query);
    
    const { subject, topic, difficulty, isSolved, createdBy, sortBy = 'recent', page = 1, limit = 10 } = req.query;
    const query = { exam: req.examContext };
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (isSolved !== undefined) query.isSolved = isSolved === 'true';
    if (createdBy) query.createdBy = createdBy;

    console.log('🔍 MongoDB query:', query);

    // Handle sortBy - support both 'recent'/'trending' and MongoDB sort strings like '-createdAt'
    let sort;
    if (sortBy.startsWith('-')) {
      // Handle MongoDB sort format (e.g., '-createdAt')
      const field = sortBy.substring(1);
      sort = { [field]: -1 };
    } else if (sortBy === 'trending') {
      sort = { viewCount: -1, upvotes: -1 };
    } else {
      // Default to recent (createdAt descending)
      sort = { createdAt: -1 };
    }
    
    console.log('📈 Sort order:', sort);
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count and questions
    const [total, questions] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query)
        .populate('subject topic createdBy')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
    ]);

    console.log('✅ Found', total, 'questions, returning page', pageNum);
    
    res.json({ 
      success: true, 
      data: questions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching questions:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getQuestionById = async (req, res) => {
  try {
    console.log('🔍 Getting question by ID:', req.params.id, 'for exam:', req.examContext);
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('subject topic createdBy');
    if (!question) {
      console.log('❌ Question not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    console.log('✅ Question found:', question._id);
    res.json({ success: true, data: question });
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
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({ _id: req.params.id, exam: req.examContext, createdBy: req.userId });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found or unauthorized' });
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markSolved = async (req, res) => {
  try {
    const question = await Question.findOne(
      { _id: req.params.id, exam: req.examContext, createdBy: req.userId }
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

module.exports = { createQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion, markSolved };
