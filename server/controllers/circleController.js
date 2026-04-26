const mongoose = require('mongoose');
const Circle = require('../models/Circle');
const User = require('../models/User');

// Get all circles
const getCircles = async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'latest' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const sortStage = sort === 'most-active' ? { 'messages.createdAt': -1, createdAt: -1 } : { createdAt: -1 };

    const circles = await Circle.aggregate([
      {
        $addFields: {
          messageCount: { $size: { $ifNull: ['$messages', []] } },
          lastMessageAt: { $arrayElemAt: ['$messages.createdAt', -1] },
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const data = circles[0]?.data || [];
    const total = circles[0]?.total?.[0]?.count || 0;

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get circle by ID with messages
const getCircleById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid circle ID' });
    }

    const circleId = req.params.id;

    const circle = await Circle.findById(circleId).populate('messages.userId', 'name username profilePicture').lean();

    if (!circle) {
      return res.status(404).json({ success: false, message: 'Circle not found' });
    }

    res.json({
      success: true,
      data: {
        ...circle,
        messageCount: circle.messages?.length || 0,
      },
    });
  } catch (error) {
    console.error('[GET_CIRCLE] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add message to circle
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid circle ID' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // Use findByIdAndUpdate with $push to avoid full schema validation
    const circle = await Circle.findByIdAndUpdate(
      id,
      {
        $push: {
          messages: {
            userId,
            text: text.trim(),
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('messages.userId', 'name username profilePicture');

    if (!circle) {
      return res.status(404).json({ success: false, message: 'Circle not found' });
    }

    // Return the newly added message
    const newMessage = circle.messages[circle.messages.length - 1];

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error('[ADD_MESSAGE] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create circle (admin only or system function)
const createCircle = async (req, res) => {
  try {
    const { name, topic } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ success: false, message: 'Name and topic are required' });
    }

    const circle = await Circle.create({
      name: name.trim(),
      topic: topic.trim(),
      messages: [],
    });

    res.status(201).json({
      success: true,
      data: circle,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCircle,
  getCircles,
  getCircleById,
  addMessage,
};
