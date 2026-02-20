const Activity = require('../models/Activity');

// Get user's activities
const getUserActivities = async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    
    const query = { user: req.userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const activities = await Activity.find(query)
      .populate('actor', 'username name')
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Activity.countDocuments({ user: req.userId, isRead: false });

    res.json({ success: true, data: activities, unreadCount });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark activity as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findOneAndUpdate(
      { _id: id, user: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all activities as read
const markAllAsRead = async (req, res) => {
  try {
    await Activity.updateMany(
      { user: req.userId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All activities marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to create activity
const createActivity = async (activityData) => {
  try {
    const activity = await Activity.create(activityData);
    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};

module.exports = { 
  getUserActivities, 
  markAsRead, 
  markAllAsRead,
  createActivity 
};
