const Question = require('../models/Question');
const Resource = require('../models/Resource');
const Story = require('../models/Story');
const User = require('../models/User');

const escapeRegex = (text) => text ? text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

const globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', subject, topic } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    const commonFilters = { exam: req.examContext };
    if (subject) commonFilters.subject = subject;
    if (topic) commonFilters.topic = topic;

    const results = {};

    if (type === 'all' || type === 'question') {
      results.questions = await Question.find({ ...commonFilters, $or: [{ title: regex }, { description: regex }] })
        .populate('subject topic createdBy').limit(20);
    }

    if (type === 'all' || type === 'resource') {
      results.resources = await Resource.find({ ...commonFilters, $or: [{ title: regex }, { description: regex }] })
        .populate('subject topic uploadedBy').limit(20);
    }

    if (type === 'all' || type === 'story') {
      results.stories = await Story.find({ exam: req.examContext, $or: [{ title: regex }, { content: regex }] })
        .populate('author').limit(20);
    }

    if (type === 'user') {
      results.users = await User.find({ $or: [{ username: regex }, { displayName: regex }] })
        .select('-passwordHash').limit(20);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchQuestions = async (req, res) => {
  try {
    const { q, subject, topic, difficulty, isSolved } = req.query;
    const query = { exam: req.examContext };
    if (q) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (isSolved !== undefined) query.isSolved = isSolved === 'true';

    const questions = await Question.find(query).populate('subject topic createdBy').limit(50);
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchResources = async (req, res) => {
  try {
    const { q, subject, topic, type } = req.query;
    const query = { exam: req.examContext };
    if (q) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (type) query.type = type;

    const resources = await Resource.find(query).populate('subject topic uploadedBy').limit(50);
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { globalSearch, searchQuestions, searchResources };
