const User = require('../models/User');
const Question = require('../models/Question');
const Resource = require('../models/Resource');
const Story = require('../models/Story');
const Answer = require('../models/Answer');
const Activity = require('../models/Activity');

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('-passwordHash -blockedUsers');
    if (!user || !user.isActive) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, location, website, profilePicture } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { displayName, bio, location, website, profilePicture },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const [questions, answers, resources, stories] = await Promise.all([
      Question.find({ createdBy: userId, exam: req.examContext }).populate('subject topic'),
      Answer.find({ author: userId, exam: req.examContext }).populate('question'),
      Resource.find({ uploadedBy: userId, exam: req.examContext }).populate('subject topic'),
      Story.find({ author: userId, exam: req.examContext })
    ]);
    res.json({ success: true, data: { questions, answers, resources, stories } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid current password' });

    user.passwordHash = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete user account permanently
 * Removes all user data including questions, answers, resources, stories, and activities
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId;

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required to delete account' 
      });
    }

    // Find user with password
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }

    // Delete all user data in parallel
    await Promise.all([
      // Delete user's questions
      Question.deleteMany({ createdBy: userId }),
      
      // Delete user's answers
      Answer.deleteMany({ author: userId }),
      
      // Delete user's resources
      Resource.deleteMany({ uploadedBy: userId }),
      
      // Delete user's stories
      Story.deleteMany({ author: userId }),
      
      // Delete activities where user is the actor or recipient
      Activity.deleteMany({ $or: [{ user: userId }, { actor: userId }] }),
      
      // Remove user from other users' blocked lists
      User.updateMany(
        { blockedUsers: userId },
        { $pull: { blockedUsers: userId } }
      ),
      
      // Delete the user account
      User.findByIdAndDelete(userId)
    ]);

    res.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Update user settings (level, goal, privacy)
 */
const updateSettings = async (req, res) => {
  try {
    const { level, goal, privacy } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update fields if provided
    if (level) user.level = level;
    if (goal) user.goal = goal;
    if (privacy) user.privacy = { ...user.privacy, ...privacy };

    await user.save();

    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Change user's primary exam
 */
const changePrimaryExam = async (req, res) => {
  try {
    const { newExam } = req.body;
    const userId = req.userId;

    if (!newExam) {
      return res.status(400).json({ 
        success: false, 
        message: 'New exam is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.primaryExam = newExam;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Primary exam changed successfully',
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = { getUserProfile, getMe, updateProfile, getUserActivity, changePassword, deleteAccount, updateSettings, changePrimaryExam };
