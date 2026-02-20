const Subject = require('../models/Subject');
const Topic = require('../models/Topic');

const getSubjects = async (req, res) => {
  try {
    console.log('🔍 Getting subjects for exam:', req.examContext);
    const subjects = await Subject.find({ exam: req.examContext, isActive: true }).sort('displayOrder name');
    console.log('✅ Found subjects:', subjects.length);
    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('❌ Error getting subjects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTopicsBySubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject || subject.exam.toString() !== req.examContext.toString()) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    const topics = await Topic.find({ subject: req.params.subjectId, exam: req.examContext, isActive: true })
      .sort('displayOrder name');
    res.json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, exam: req.examContext });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, exam: req.examContext }).populate('subject');
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.json({ success: true, data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSubjects, getTopicsBySubject, getSubjectById, getTopicById };
