const Story = require('../models/Story');

const getAllStories = async (req, res) => {
  try {
    const { type, sortBy = 'recent' } = req.query;
    const query = { exam: req.examContext };
    if (type && type !== 'all') query.type = type;

    const sort = sortBy === 'popular' ? { upvotesCount: -1, views: -1 } : { createdAt: -1 };
    const stories = await Story.find(query).populate('author').sort(sort);
    res.json({ success: true, data: stories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStoryById = async (req, res) => {
  try {
    const story = await Story.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    res.json({ success: true, data: story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStory = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const story = await Story.create({
      title, content, type, exam: req.examContext, author: req.userId
    });
    await story.populate('author');
    res.status(201).json({ success: true, data: story });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateStory = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const story = await Story.findOneAndUpdate(
      { _id: req.params.id, exam: req.examContext, author: req.userId },
      { title, content, type },
      { new: true, runValidators: true }
    ).populate('author');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found or unauthorized' });
    res.json({ success: true, data: story });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteStory = async (req, res) => {
  try {
    const story = await Story.findOneAndDelete({ _id: req.params.id, exam: req.examContext, author: req.userId });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found or unauthorized' });
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllStories, getStoryById, createStory, updateStory, deleteStory };
