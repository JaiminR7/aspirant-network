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

    // Create activity for question owner if not anonymous and not the owner answering their own question
    if (!isAnonymous && question.author && question.author.toString() !== req.userId) {
      await createActivity({
        user: question.author,
        type: 'answer',
        actor: req.userId,
        question: req.params.questionId,
        answer: answer._id,
        message: `answered your question: "${question.title}"`
      });
    }

    res.status(201).json({ success: true, data: answer });
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
    const { author } = req.query;
    const query = { exam: req.examContext };
    if (author) query.author = author;

    const answers = await Answer.find(query)
      .populate('author question')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: answers });
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
    const answer = await Answer.findOneAndDelete({ _id: req.params.id, exam: req.examContext, author: req.userId });
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found or unauthorized' });
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

module.exports = { createAnswer, getAnswersByQuestion, getAllAnswers, updateAnswer, deleteAnswer, markAccepted };
